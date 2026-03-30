const httpProxy = require('http-proxy');
const deploymentService = require('./services/deploymentService');

const proxy = httpProxy.createProxyServer({});

// Middleware to route traffic based on the active environment
module.exports = (req, res, next) => {
  const deploymentName = req.params.name;
  const targetPort = deploymentService.getRoute(deploymentName);

  if (!targetPort) {
    return res.status(404).json({ error: 'Deployment not found or no active environment routing set.' });
  }

  const targetUrl = `http://127.0.0.1:${targetPort}`;
  
  // Forward the request to the target URL
  proxy.web(req, res, { target: targetUrl }, (e) => {
    console.error(`Proxy error for ${deploymentName}:`, e.message);
    res.status(502).json({ error: 'Bad Gateway: Failed to proxy request to the container' });
  });
};
