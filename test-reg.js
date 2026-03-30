const axios = require('axios');
axios.post('http://localhost:3000/api/auth/register', { name: "test", email: "test2@test.com", password: "test" })
  .then(res => console.log('SUCCESS', res.data))
  .catch(err => console.log('ERROR', err.response ? err.response.data : err.message));
