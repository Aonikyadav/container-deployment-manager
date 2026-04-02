const User = require('../models/User');
const Deployment = require('../models/Deployment');

/**
 * Get overall system statistics
 */
exports.getSystemStats = async (req, res) => {
  try {
    console.log("[ADMIN_STATS] Fetching overall system statistics...");
    const totalUsers = await User.countDocuments();
    const totalDeployments = await Deployment.countDocuments();
    
    console.log(`[ADMIN_STATS] Statistics Found: Users=${totalUsers}, Deployments=${totalDeployments}`);
    res.json({
      success: true,
      data: {
        totalUsers,
        totalDeployments
      }
    });
  } catch (error) {
    console.error("[ADMIN_STATS_ERROR]", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get detailed list of users and their deployments
 */
exports.getDetailedUsers = async (req, res) => {
  try {
    console.log("[ADMIN_DETAILS] Fetching all user activities...");
    const users = await User.find().select('-password');
    const userDetails = await Promise.all(users.map(async (user) => {
      const userDeployments = await Deployment.find({ userId: user._id });
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        deploymentCount: userDeployments.length,
        deployments: userDeployments.map(d => ({
          name: d.name,
          image: d.image,
          status: d.status
        }))
      };
    }));

    console.log(`[ADMIN_DETAILS] Fetched data for ${users.length} users.`);
    res.json({
      success: true,
      data: userDetails
    });
  } catch (error) {
    console.error("[ADMIN_DETAILS_ERROR]", error);
    res.status(500).json({ error: error.message });
  }
};
