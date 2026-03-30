const mongoose = require("mongoose");

const containerSchema = new mongoose.Schema({
  deploymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Deployment", required: true },
  dockerId: { type: String, required: true },
  name: { type: String, required: true },
  environment: { type: String, enum: ['blue', 'green'], required: true },
  status: { 
    type: String, 
    enum: ['created', 'running', 'exited', 'dead', 'stopped'], 
    default: 'created' 
  },
  hostPort: { type: Number, required: true },
  cpuUsage: { type: String },
  memoryUsage: { type: String },
  startedAt: { type: Date },
  stoppedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Container", containerSchema);
