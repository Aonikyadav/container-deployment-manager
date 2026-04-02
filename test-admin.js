const axios = require('axios');

async function testAdminPanel() {
  const baseURL = 'http://127.0.0.1:31234/api';
  console.log(`[TEST] Targeting backend at ${baseURL}`);

  try {
    // 1. Login as Admin
    console.log('[TEST] Attempting login as admin@deployment.com...');
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@deployment.com',
      password: 'admin'
    });

    const token = loginRes.data.data.token;
    console.log('[TEST] Login successful. Token received.');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Test Stats Endpoint
    console.log('[TEST] Calling /admin/stats...');
    const statsRes = await axios.get(`${baseURL}/admin/stats`, { headers });
    console.log('[TEST] /admin/stats response:', JSON.stringify(statsRes.data, null, 2));

    // 3. Test Users Endpoint
    console.log('[TEST] Calling /admin/users...');
    const usersRes = await axios.get(`${baseURL}/admin/users`, { headers });
    console.log('[TEST] /admin/users response (count):', usersRes.data.data.length);

    console.log('\n[SUCCESS] Admin panel API is fully functional.');

  } catch (err) {
    console.error('\n[FAILURE] Admin panel test failed!');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(`Data: ${JSON.stringify(err.response.data)}`);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

testAdminPanel();
