require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");

const deploymentRoutes = require("./routes/deploymentRoutes");
const authRoutes = require("./routes/authRoutes");
const User = require("./models/User");
const Deployment = require("./models/Deployment");
const proxyMiddleware = require("./proxy");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/container-deployment";

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB successfully");
    try {
      let admin = await User.findOne({ email: "admin@deployment.com" });
      if (!admin) {
        admin = await User.create({ name: "Super Admin", email: "admin@deployment.com", password: "admin", role: "admin" });
        console.log("Created default Admin user: admin@deployment.com");

        const orphanedDeployments = await Deployment.find({ userId: { $exists: false } });
        let migrated = 0;
        for (const target of orphanedDeployments) {
          target.userId = admin._id;
          await target.save();
          migrated++;
        }
        console.log(`Migrated ${migrated} old orphaned deployments safely to Admin database.`);
      }
    } catch(e) { console.error("Migration error:", e); }
  })
  .catch(e => console.error("MongoDB connection error:", e));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Container Deployment Manager API is running." });
});

// Authentication API Routes
app.use("/api/auth", authRoutes);
// Management API Routes
app.use("/api/deployments", deploymentRoutes);

// Reverse Proxy Route (e.g. /proxy/my-app/some/path)
// The regex ensures the rest of the path is proxy forwarded
app.use("/proxy/:name", proxyMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
