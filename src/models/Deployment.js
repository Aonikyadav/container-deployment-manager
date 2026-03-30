const mongoose = require("mongoose");

const deploymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, unique: true },
  image: { type: String, required: true },
  version: { type: String, required: true },
  envVars: { type: Map, of: String, default: {} },
  targetPort: { type: Number, required: true }, // The port the app listens to inside the container
  replicas: { type: Number, default: 1 },
  status: { 
    type: String, 
    enum: ['pending', 'deploying', 'running', 'failed', 'stopped'], 
    default: 'pending' 
  },
  currentEnvironment: {
    type: String,
    enum: ['none', 'blue', 'green'],
    default: 'none'
  },
  activePort: { type: Number }, // Port exposed by proxy or the active port
  bluePort: { type: Number }, // Internal exposed port for blue environment
  greenPort: { type: Number } // Internal exposed port for green environment
}, { timestamps: true });

module.exports = mongoose.model("Deployment", deploymentSchema);
