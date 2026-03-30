const Deployment = require('../models/Deployment');
const Container = require('../models/Container');
const dockerService = require('./dockerService');

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
        if (dep.activePort) {
          routingTable.set(dep.name, dep.activePort);
        }
      }
      console.log('Routing table loaded:', Array.from(routingTable.entries()));
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

  async createDeployment({ name, image, version, targetPort, envVars = {} }) {
    // Generate ports. In production, this should use a port allocator or dynamic reverse proxy configuration
    const bluePort = 8000 + Math.floor(Math.random() * 1000);
    const greenPort = 9000 + Math.floor(Math.random() * 1000);
    
    const deployment = new Deployment({
      name, image, version, targetPort, envVars,
      bluePort, greenPort,
      currentEnvironment: 'none',
      status: 'pending'
    });

    await deployment.save();
    return deployment;
  }

  async triggerDeployment(deploymentId, newImage = null, newVersion = null) {
    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) throw new Error('Deployment not found');

    const targetEnv = deployment.currentEnvironment === 'blue' ? 'green' : 'blue';
    const hostPort = targetEnv === 'blue' ? deployment.bluePort : deployment.greenPort;
    
    deployment.status = 'deploying';
    if (newImage) deployment.image = newImage;
    if (newVersion) deployment.version = newVersion;
    await deployment.save();

    const containerName = `${deployment.name}-${targetEnv}-${Date.now()}`;
    
    try {
      // 1. Run the new container
      const dockerId = await dockerService.runContainer({
        image: deployment.image,
        name: containerName,
        envVars: deployment.envVars,
        hostPort,
        targetPort: deployment.targetPort
      });

      // 2. Save tracking info
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

      // 3. Healthcheck Simulation (Wait 5s to ensure starting up)
      console.log(`Waiting for ${containerName} to become healthy...`);
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 4. Switch Traffic over to new environment
      deployment.currentEnvironment = targetEnv;
      deployment.activePort = hostPort;
      deployment.status = 'running';
      await deployment.save();

      routingTable.set(deployment.name, hostPort);
      console.log(`Traffic switched to ${targetEnv} on port ${hostPort} for ${deployment.name}`);

      // 5. Cleanup the old environment
      const oldEnv = targetEnv === 'blue' ? 'green' : 'blue';
      const oldContainers = await Container.find({ 
        deploymentId: deployment._id, 
        environment: oldEnv,
        status: 'running' 
      });

      for (const oldCont of oldContainers) {
        console.log(`Stopping and removing old container ${oldCont.name}...`);
        await dockerService.stopContainer(oldCont.dockerId);
        await dockerService.removeContainer(oldCont.dockerId);
        oldCont.status = 'stopped';
        oldCont.stoppedAt = new Date();
        await oldCont.save();
      }

      return deployment;

    } catch (err) {
      console.error('Deployment failed:', err);
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
    deployment.activePort = null;
    await deployment.save();

    routingTable.delete(deployment.name);
    console.log(`Traffic routing stopped for ${deployment.name}`);

    return deployment;
  }

  async deleteDeployment(deploymentId) {
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
    // Basic scaling logic - only implemented partially for the scope of the project
    // Advanced orchestration would involve Docker Swarm/Compose APIs or Kubernetes.
    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) throw new Error('Deployment not found');
    deployment.replicas = replicas;
    await deployment.save();
    return deployment;
  }
}

module.exports = new DeploymentService();
