const http = require('http');
http.get('http://localhost:3000/api/deployments', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    require('fs').writeFileSync('deps.json', data);
    console.log("Done");
  });
}).on('error', (err) => {
  require('fs').writeFileSync('deps.json', 'Error: ' + err.message);
});
