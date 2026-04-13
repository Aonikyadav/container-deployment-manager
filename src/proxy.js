const httpProxy = require('http-proxy');
const deploymentService = require('./services/deploymentService');

const proxy = httpProxy.createProxyServer({});
const counters = new Map();

// Middleware to route traffic based on the active environment (Load Balanced)
module.exports = (req, res, next) => {
  const deploymentName = req.params.name;
  const targetPorts = deploymentService.getRoute(deploymentName);

  if (!targetPorts || (Array.isArray(targetPorts) && targetPorts.length === 0)) {
    return res.status(404).json({ error: 'Deployment not found or no active replicas found.' });
  }

  // Handle both single port (legacy) and array of ports (new)
  const ports = Array.isArray(targetPorts) ? targetPorts : [targetPorts];
  
  // Round-Robin Selection
  let index = counters.get(deploymentName) || 0;
  const targetPort = ports[index % ports.length];
  counters.set(deploymentName, (index + 1) % ports.length);

  const targetUrl = `http://127.0.0.1:${targetPort}`;
  
  // Forward the request to the selected replica
  proxy.web(req, res, { target: targetUrl }, (e) => {
    console.error(`Proxy error for ${deploymentName} on port ${targetPort}:`, e.message);
    res.status(502).json({ error: 'Bad Gateway: Failed to proxy request to the replica' });
  });
};



