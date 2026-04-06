const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\AONAK YADAV\\.gemini\\antigravity\\brain\\5a709fef-337d-49f6-956f-649784dd51d9';
const destDir = path.join(__dirname, 'docs', 'screenshots');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(path.join(srcDir, 'login_page_screenshot_1775476147765.png'), path.join(destDir, 'login_page.png'));
fs.copyFileSync(path.join(srcDir, 'dashboard_screenshot_1775476166303.png'), path.join(destDir, 'dashboard.png'));
fs.copyFileSync(path.join(srcDir, 'admin_page_screenshot_1775476180656.png'), path.join(destDir, 'admin_page.png'));

console.log('Images copied successfully!');
