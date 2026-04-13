const http = require('http');

const data = JSON.stringify({
  name: "my-web-app",
  image: "nginx:latest",
  version: "1.0.0",
  targetPort: 80
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/deployments',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('RESPONSE_BODY:', body));
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();



