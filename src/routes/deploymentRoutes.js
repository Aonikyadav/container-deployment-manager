const express = require('express');
const router = express.Router();
const deploymentController = require('../controllers/deploymentController');
const { protect } = require('../middlewares/authMiddleware');

// Secure all deployment routes
router.use(protect);

// Creation & Triggers
router.post('/', deploymentController.createDeployment);
router.post('/:id/deploy', deploymentController.triggerDeploy);

// Lists
router.get('/', deploymentController.listDeployments);
router.get('/:id/history', deploymentController.getDeploymentHistory);

// Monitoring & Logs
router.get('/:id/logs', deploymentController.getDeploymentLogs);
router.get('/:id/history', deploymentController.getDeploymentHistory);
router.post('/:id/scale', deploymentController.scaleDeployment);
router.post('/:id/stop', deploymentController.stopDeployment);
router.delete('/:id', deploymentController.deleteDeployment);

module.exports = router;
