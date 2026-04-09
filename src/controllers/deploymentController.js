const deploymentService = require('../services/deploymentService');
const Deployment = require('../models/Deployment');
const Container = require('../models/Container');
const dockerService = require('../services/dockerService');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

exports.createDeployment = async (req, res) => {
  try {
    const { name, image, version, targetPort, envVars, replicas, repoUrl, postStartScript } = req.body;
    console.log(`[DEBUG] Creating deployment ${name} with replicas:`, replicas);
    const deployment = await deploymentService.createDeployment({ 
      name, image, version, targetPort, envVars, userId: req.user.id, 
      replicas: replicas ? parseInt(replicas) : 1, 
      repoUrl, postStartScript 
    });
    
    // Auto-trigger deployment immediately for better UX
    console.log(`[DEBUG] Auto-triggering deployment for ${name} after creation...`);
    deploymentService.triggerDeployment(deployment._id).catch(err => {
      console.error(`[ERROR] Auto-deploy failed for ${name}:`, err.message);
    });

    res.status(201).json({ message: 'Deployment initialized and triggering...', data: deployment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.triggerDeploy = async (req, res) => {
  try {
    const { id } = req.params;
    const { image, version } = req.body;
    // We execute this synchronously in the response for simplicity, 
    // but in reality this should be a background job tracking progress.
    const deployment = await deploymentService.triggerDeployment(id, image, version);
    res.status(200).json({ message: 'Deployment completed successfully', data: deployment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.stopDeployment = async (req, res) => {
  try {
    const { id } = req.params;
    const deployment = await deploymentService.stopDeployment(id);
    res.status(200).json({ message: 'Deployment stopped securely', data: deployment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDeployment = async (req, res) => {
  try {
    const { id } = req.params;
    await deploymentService.deleteDeployment(id);
    res.status(200).json({ message: 'Deployment entirely eradicated from existence.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listDeployments = async (req, res) => {
  try {
    const deployments = await Deployment.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ data: deployments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDeploymentLogs = async (req, res) => {
  try {
    const { id } = req.params;
    // Find active container for this deployment
    const container = await Container.findOne({ deploymentId: id, status: 'running' });
    if (!container) return res.status(404).json({ error: 'No running container found for deployment' });
    
    const logs = await dockerService.getLogs(container.dockerId);
    res.status(200).json({ data: logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDeploymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await deploymentService.getDeploymentHistory(id);
    res.status(200).json({ data: history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.scaleDeployment = async (req, res) => {
  try {
    const { id } = req.params;
    const { replicas } = req.body;
    const scaled = await deploymentService.scaleDeployment(id, replicas);
    res.status(200).json({ message: 'Deployment scaled', data: scaled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//deploymentController.js - updated auth logic