const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const API_BASE = 'http://localhost:3000/api';
let token = '';
let deploymentId = '';

async function runTest() {
  console.log('🚀 Starting E2E Test for Container Deployment Manager...');

  try {
    // 1. Check if Docker is running
    console.log('Step 1: Checking Docker status...');
    await execPromise('docker info');
    console.log('✅ Docker is running.');

    // 2. Register/Login
    console.log('Step 2: Authenticating...');
    const authRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Tester',
      email: `test-${Date.now()}@example.com`,
      password: 'password123'
    });
    token = authRes.data.token;
    console.log('✅ Authenticated successfully.');

    const config = { headers: { Authorization: `Bearer ${token}` } };

    // 3. Create Deployment
    console.log('Step 3: Creating deployment configuration...');
    const createRes = await axios.post(`${API_BASE}/deployments`, {
      name: `e2e-nginx-${Date.now()}`,
      image: 'nginx:alpine',
      version: 'latest',
      targetPort: 80
    }, config);
    deploymentId = createRes.data.data._id;
    const deploymentName = createRes.data.data.name;
    console.log(`✅ Deployment created with ID: ${deploymentId}`);

    // 4. Trigger Deployment
    console.log('Step 4: Triggering deployment (this involves pulling image and port health-check)...');
    const deployRes = await axios.post(`${API_BASE}/deployments/${deploymentId}/deploy`, {}, config);
    console.log('✅ Deployment triggered and completed successfully.');
    console.log('Status:', deployRes.data.data.status);
    console.log('Active Port:', deployRes.data.data.activePort);

    // 5. Verify Proxy
    console.log('Step 5: Verifying reverse proxy traffic...');
    // The backend proxies /proxy/:name to the container
    const proxyUrl = `http://localhost:3000/proxy/${deploymentName}`;
    const proxyRes = await axios.get(proxyUrl);
    if (proxyRes.status === 200 && proxyRes.data.includes('Welcome to nginx!')) {
      console.log('✅ Proxy verification successful! Container is reachable via /proxy route.');
    } else {
      throw new Error('Proxy verification failed: Unexpected response from container.');
    }

    // 6. Stop Deployment
    console.log('Step 6: Stopping deployment...');
    await axios.post(`${API_BASE}/deployments/${deploymentId}/stop`, {}, config);
    console.log('✅ Deployment stopped.');

    // 7. Delete Deployment
    console.log('Step 7: Deleting deployment (eradication)...');
    await axios.delete(`${API_BASE}/deployments/${deploymentId}`, config);
    console.log('✅ Deployment deleted.');

    console.log('\n✨ ALL E2E TESTS PASSED SUCCESSFULLY! ✨');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ E2E TEST FAILED!');
    console.error('Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    
    // Cleanup attempt
    if (deploymentId) {
      console.log('Attempting emergency cleanup...');
      try {
        await axios.delete(`${API_BASE}/deployments/${deploymentId}`, { headers: { Authorization: `Bearer ${token}` } });
      } catch (e) {}
    }
    process.exit(1);
  }
}

runTest();
