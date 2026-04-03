const { execSync } = require('child_process');
const fs = require('fs');
try {
  const status = execSync('git status').toString();
  fs.writeFileSync('git_status_node.txt', status);
  if (status.includes('rebase')) {
     execSync('git rebase --abort');
     fs.writeFileSync('git_status_node.txt', 'Rebase aborted cleanly');
  }
} catch (e) {
  fs.writeFileSync('git_status_node.txt', e.message + '\n' + e.stdout?.toString());
}
