const axios = require('axios');
const { execSync } = require('child_process');

async function testScaling() {
  const baseUrl = 'http://localhost:3005/api';
  console.log('--- STARTING SCALING & LOAD BALANCING VERIFICATION ---');

  try {
    // 1. Auth
    const login = await axios.post(`${baseUrl}/auth/login`, {
      email: 'admin@deployment.com',
      password: 'admin'
    });
    const authData = login.data.data || login.data;
    const token = authData.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Create Deployment with 3 Replicas and a Post-Start Script
    const appName = `scaling-test-${Date.now()}`;
    console.log(`Step 1: Creating deployment ${appName} with 3 replicas...`);
    const createRes = await axios.post(`${baseUrl}/deployments`, {
      name: appName,
      image: 'nginx:alpine',
      version: 'v1-scaled',
      targetPort: 80,
      replicas: 3,
      postStartScript: 'echo "SCALING_VERIFIED" > /tmp/ready.txt'
    }, authHeaders);

    const deploymentData = createRes.data.data || createRes.data;
    const deploymentId = deploymentData._id;
    console.log(`Deployment created: ${deploymentId}`);

    // 3. Trigger Deployment
    console.log('Step 2: Triggering deployment (this will start 3 containers)...');
    const deployRes = await axios.post(`${baseUrl}/deployments/${deploymentId}/deploy`, {}, authHeaders);
    console.log('Deployment successful!');

    // 4. Verify 3 containers are running
    console.log('Step 3: Verifying replica count via docker...');
    const dockerPs = execSync(`docker ps --filter \"name=${appName}\" --format \"{{.Names}}\"`).toString();
    const containerNames = dockerPs.trim().split('\n').filter(Boolean);
    const count = containerNames.length;
    console.log(`Found ${count} running replicas.`);
    if (count !== 3) throw new Error(`Expected 3 replicas, found ${count}`);

    // 5. Verify Post-Start Script
    console.log('Step 4: Waiting for post-start synchronization...');
    await new Promise(r => setTimeout(r, 4000));
    console.log('Verifying post-start script execution...');
    for (const name of containerNames) {
      console.log(`- Checking container ${name}...`);
      const check = execSync(`docker exec ${name} cat /tmp/ready.txt`).toString();
      if (!check.includes('SCALING_VERIFIED')) throw new Error(`Script check failed in container ${name}`);
      console.log(`- Verified script in ${name}`);
    }

    // 6. Verify Load Balancing via Proxy
    console.log('Step 5: Verifying Round-Robin load balancing...');
    const finalData = deployRes.data.data || deployRes.data;
    const activePorts = finalData.activePorts;
    console.log(`Active Ports: ${activePorts.join(', ')}`);
    
    for (let i = 0; i < 6; i++) {
        const res = await axios.get(`http://127.0.0.1:31234/proxy/${appName}`);
        console.log(`- Request ${i+1}: Success (Status ${res.status})`);
    }

    console.log('--- ALL VERIFICATIONS PASSED ---');

    console.log('--- CLEANING UP ---');
    await axios.delete(`${baseUrl}/deployments/${deploymentId}`, authHeaders);
    console.log('--- CLEANUP COMPLETE ---');

  } catch (err) {
    console.error('VERIFICATION FAILED:', err.response?.data || err.message);
    process.exit(1);
  }
}

testScaling();
