const { execSync } = require('child_process');
const fs = require('fs');
try {
  const status = execSync('node src/app.js', { timeout: 4000 }).toString();
  fs.writeFileSync('node_crash_log.txt', status);
} catch (e) {
  fs.writeFileSync('node_crash_log.txt', e.message + '\n' + e.stdout?.toString() + '\n' + e.stderr?.toString());
}




