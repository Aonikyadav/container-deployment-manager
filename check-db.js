const mongoose = require('mongoose');
const Deployment = require('./src/models/Deployment');
const Container = require('./src/models/Container');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/container-deployment");
  const deps = await Deployment.find().sort({createdAt: -1}).limit(3);
  console.log("Recent Deployments:");
  deps.forEach(d => console.log(`- ${d.name} | targetPort: ${d.targetPort} | Status: ${d.status} | Env: ${d.currentEnvironment} | activePorts: ${d.activePorts}`));
  
  console.log("\nRecent Containers:");
  const conts = await Container.find().sort({createdAt: -1}).limit(5);
  conts.forEach(c => console.log(`- ${c.name} | Status: ${c.status} | hostPort: ${c.hostPort}`));

  process.exit();
}
check();
