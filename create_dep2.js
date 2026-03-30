fetch('http://localhost:3000/api/deployments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: "my-web-app", image: "nginx:latest", version: "1.0.0", targetPort: 80 })
}).then(r => r.json()).then(data => require('fs').writeFileSync('out.json', JSON.stringify(data))).catch(err => require('fs').writeFileSync('out.json', JSON.stringify({error: err.message})));
