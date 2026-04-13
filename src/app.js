require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");

const deploymentRoutes = require("./routes/deploymentRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const path = require("path");
const User = require("./models/User");
const Deployment = require("./models/Deployment");
const proxyMiddleware = require("./proxy");

const app = express();
const PORT = 31234;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/container-deployment";

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

// GLOBAL REQUEST LOGGER for debugging
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// Serve production static assets
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB successfully");
    try {
      let admin = await User.findOne({ email: "admin@deployment.com" });
      if (!admin) {
        admin = await User.create({ name: "Super Admin", email: "admin@deployment.com", password: "admin", role: "admin" });
        console.log("Created default Admin user: admin@deployment.com");
      } else {
        admin.role = 'admin';
        admin.password = 'admin'; // Re-hash on next save in User model
        await admin.save();
        console.log("Force-migrated admin@deployment.com to Administrator role.");
      }
      
      const orphanedDeployments = await Deployment.find({ userId: { $exists: false } });
      let migrated = 0;
      for (const target of orphanedDeployments) {
        target.userId = admin._id;
        await target.save();
        migrated++;
      }
      if (migrated > 0) console.log(`Migrated ${migrated} old orphaned deployments safely to Admin database.`);
    } catch(e) { console.error("Migration/Admin setup error:", e); }
  })
  .catch(e => console.error("MongoDB connection error:", e));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Container Deployment Manager API is running." });
});

// Authentication API Routes
app.use("/api/auth", authRoutes);

// Management API Routes
app.use("/api/deployments", deploymentRoutes);

// Infrastructure & Admin API Routes
app.use("/api/admin", adminRoutes);

// Reverse Proxy Route (e.g. /proxy/my-app/some/path)
// The regex ensures the rest of the path is proxy forwarded
app.use("/proxy/:name", proxyMiddleware);

// Catch-all for undefined API routes (Prevents the sendFile error)
app.use("/api", (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}. Please ensure you are using the correct HTTP method (e.g., POST instead of GET).` });
});

// Catch-all for SPA routing (must be last)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`[BOOT] SERVER_ID_${Date.now()}`);
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});


