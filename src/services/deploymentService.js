const mongoose = require('mongoose');
const Deployment = require('../models/Deployment');
const Container = require('../models/Container');
const dockerService = require('./dockerService');
const net = require('net');

// In-memory route table for Blue-Green fast switching
const routingTable = new Map();

class DeploymentService {
  constructor() {
    this.loadRoutes();
  }

  async loadRoutes() {
    try {
      const deployments = await Deployment.find({ status: 'running' });
      for (const dep of deployments) {
        if (dep.activePorts && dep.activePorts.length > 0) {
          routingTable.set(dep.name, dep.activePorts);
        }
      }
      console.log('Routing table loaded (Single-Instance):', Array.from(routingTable.entries()));
    } catch (err) {
      console.error('Failed to load routes from DB on start:', err);
    }
  }

  getRoute(name) {
    return routingTable.get(name);
  }

  getAllRoutes() {
    return Array.from(routingTable.entries()).map(([name, port]) => ({ name, port }));
  }

  async createDeployment({ name, image, version, targetPort, envVars = {}, userId, repoUrl = '', postStartScript = '' }) {
    console.log(`[SERVICE] Creating deployment ${name}...`);
    // Generate ports for blue and green environments
    const bluePorts = [8000 + Math.floor(Math.random() * 1000)];
    const greenPorts = [9000 + Math.floor(Math.random() * 1000)];
    
    const deployment = new Deployment({
      name, image, version, targetPort, envVars, userId, repoUrl, postStartScript,
      bluePorts, greenPorts,
      replicas: 1,
      currentEnvironment: 'none',
      status: 'pending'
    });

    await deployment.save();
    return deployment;
  }

  async triggerDeployment(deploymentId, newImage = null, newVersion = null) {
    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) throw new Error('Deployment not found');
    console.log(`[ORCHESTRATOR_START] Triggering deployment for ${deployment.name} (${deploymentId}) with NEW_IMAGE=${newImage}`);

    const targetEnv = deployment.currentEnvironment === 'blue' ? 'green' : 'blue';
    const targetPorts = targetEnv === 'blue' ? deployment.bluePorts : deployment.greenPorts;
    
    deployment.status = 'deploying';
    if (newImage) deployment.image = newImage;
    if (newVersion) deployment.version = newVersion;
    await deployment.save();

    const timestamp = Date.now();
    const newContainers = [];

    // 0. Pull image once before replica loop for maximum speed
    try {
      await dockerService.pullImage(deployment.image);
    } catch (e) {
      console.warn(`[ORCHESTRATOR] Initial pull for ${deployment.image} failed, proceeding with cache.`);
    }

    try {
      // 1. Run and healthcheck single container
      const targetPorts = deployment.currentEnvironment === 'blue' ? deployment.greenPorts : deployment.bluePorts;
      if (!targetPorts || targetPorts.length === 0) {
        // Fallback for missing/undefined port data in old deployments
        deployment.bluePorts = [8000 + Math.floor(Math.random() * 1000)];
        deployment.greenPorts = [9000 + Math.floor(Math.random() * 1000)];
        await deployment.save();
      }
      
      const hostPort = (deployment.currentEnvironment === 'blue' ? deployment.greenPorts : deployment.bluePorts)[0];
      
      // Slugify name for Docker (lowercase, remove spaces and special chars)
      const slugName = deployment.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const containerName = `${slugName}-${targetEnv}-${timestamp}`;
      
      console.log(`[ORCHESTRATOR] Launching container on port ${hostPort}...`);
      
      // Strip any tag already embedded in the image name (e.g. "nginx:latest" → "nginx")
      // then re-attach the canonical version tag.
      const baseImage = deployment.image.includes(':')
        ? deployment.image.split(':')[0]
        : deployment.image;
      const tag = (deployment.version && deployment.version.trim()) ? deployment.version.trim() : 'latest';
      const fullImage = `${baseImage}:${tag}`;

      const dockerId = await dockerService.runContainer({
        image: fullImage,
        name: containerName,
        envVars: deployment.envVars,
        hostPort,
        targetPort: deployment.targetPort
      });

      const container = new Container({
        deploymentId: deployment._id,
        dockerId,
        name: containerName,
        environment: targetEnv,
        hostPort,
        startedAt: new Date(),
        status: 'running'
      });
      await container.save();
      newContainers.push({ dockerId, hostPort, containerName });

      // Healthcheck - Faster 500ms intervals
      let healthy = false;
      for (let j = 0; j < 20; j++) {
        healthy = await new Promise(resolve => {
          const socket = new net.Socket();
          const onError = () => { socket.destroy(); resolve(false); };
          socket.setTimeout(400); // Tighter timeout
          socket.once('error', onError);
          socket.once('timeout', onError);
          socket.connect(hostPort, '127.0.0.1', () => {
            socket.end();
            resolve(true);
          });
        });
        if (healthy) break;
        await new Promise(r => setTimeout(r, 500));
      }

      if (!healthy) throw new Error(`Health check failed on port ${hostPort}`);

      // 2. Run post-start shell script if provided
      if (deployment.postStartScript) {
        console.log(`[SHELL] Running configuration script...`);
          // Stabilization delay
          await new Promise(r => setTimeout(r, 2000));
          
          console.log(`[SERVICE] Executing post-start (ID: ${dockerId.substring(0,12)})...`);
          try {
            const scriptResult = await dockerService.execCommand(dockerId, deployment.postStartScript);
            console.log(`[SERVICE] Post-start SUCCEEDED. Stdout: ${scriptResult.stdout}`);
          } catch (scriptErr) {
            console.error(`[SERVICE] Post-start FAILED:`, scriptErr.message);
          }
      }

      // 3. Switch Traffic over to new replica set
      deployment.currentEnvironment = targetEnv;
      deployment.activePorts = targetPorts;
      deployment.status = 'running';
      await deployment.save();

      routingTable.set(deployment.name, targetPorts);
      console.log(`Traffic switched to ${targetEnv} environment on port ${targetPorts[0]} for ${deployment.name}`);

      // 4. Cleanup old replica set
      const oldEnv = targetEnv === 'blue' ? 'green' : 'blue';
      const oldContainers = await Container.find({ 
        deploymentId: deployment._id, 
        environment: oldEnv,
        status: 'running' 
      });

      for (const oldCont of oldContainers) {
        console.log(`Stopping and removing old container ${oldCont.name}...`);
        try {
          await dockerService.stopContainer(oldCont.dockerId);
          await dockerService.removeContainer(oldCont.dockerId);
        } catch(e) { console.error('Error stopping container via docker', e.message); }
        oldCont.status = 'stopped';
        oldCont.stoppedAt = new Date();
        await oldCont.save();
      }

      return deployment;

    } catch (err) {
      console.error('Scaled deployment failed:', err);
      // Cleanup partially started containers on failure
      for (const c of newContainers) {
        await dockerService.stopContainer(c.dockerId).catch(() => {});
        await dockerService.removeContainer(c.dockerId).catch(() => {});
      }
      deployment.status = 'failed';
      await deployment.save();
      throw err;
    }
  }

  async stopDeployment(deploymentId) {
    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) throw new Error('Deployment not found');

    const runningContainers = await Container.find({ 
      deploymentId: deployment._id, 
      status: 'running' 
    });

    for (const cont of runningContainers) {
      console.log(`Stopping and removing container ${cont.name}...`);
      try {
        await dockerService.stopContainer(cont.dockerId);
        await dockerService.removeContainer(cont.dockerId);
      } catch(e) { console.error('Error stopping container via docker', e); }
      cont.status = 'stopped';
      cont.stoppedAt = new Date();
      await cont.save();
    }

    deployment.status = 'stopped';
    deployment.currentEnvironment = 'none';
    deployment.activePorts = [];
    await deployment.save();

    routingTable.delete(deployment.name);
    console.log(`Traffic routing stopped for ${deployment.name}`);

    return deployment;
  }

  async deleteDeployment(deploymentId) {
    if (!mongoose.Types.ObjectId.isValid(deploymentId)) {
      throw new Error('Invalid Deployment ID');
    }
    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) throw new Error('Deployment not found');

    // 1. Terminate any outstanding active Docker containers
    try {
      await this.stopDeployment(deploymentId);
    } catch (e) {
      console.log(`Minor error during pre-delete termination for ${deployment.name}. Continuing wipe sequence...`);
    }

    // 2. Cascade Drop Container Timeline Logs
    await Container.deleteMany({ deploymentId: deployment._id });

    // 3. Destroy Deployment Configuration
    await Deployment.findByIdAndDelete(deploymentId);

    console.log(`[NUKE] Utterly eradicated ${deployment.name} backwards out of MongoDB and Docker.`);
    return true;
  }

  async getDeploymentHistory(deploymentId) {
    return Container.find({ deploymentId }).sort({ createdAt: -1 });
  }

  async scaleDeployment(deploymentId, replicas) {
    console.warn(`[WARNING] scaleDeployment called for ${deploymentId} but multi-instance routing is not fully implemented.`);
    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) throw new Error('Deployment not found');
    deployment.replicas = replicas;
    await deployment.save();
    return deployment;
  }
}

module.exports = new DeploymentService();
//deploymentService.js  is the core of the container deployment manager, handling all deployment lifecycle operations including creation, triggering, stopping, and deletion of deployments. It also manages the in-memory routing table for Blue-Green deployments and interacts with the Docker service to manage containers.