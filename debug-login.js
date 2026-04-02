const axios = require('axios');
async function debug() {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@deployment.com',
      password: 'admin'
    });
    console.log('STATUS:', res.status);
    console.log('BODY:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('ERROR STATUS:', err.response?.status);
    console.error('ERROR BODY:', JSON.stringify(err.response?.data, null, 2));
  }
}
debug();
