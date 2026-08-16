const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        if (!filePath.includes('node_modules') && !filePath.includes('.next')) {
          results = results.concat(walk(filePath));
        }
      } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        results.push(filePath);
      }
    }
  } catch(e) {}
  return results;
}

const files = [
  ...walk('k:/WEBSIT/Royacenter/app'),
  ...walk('k:/WEBSIT/Royacenter/Admin/app'),
  ...walk('k:/WEBSIT/Royacenter/components'),
  ...walk('k:/WEBSIT/Royacenter/Admin/components')
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/\{(\w+)\.phone\}/g, "{$1.phone?.replace(/^\\\\+?20/, '0')}");
  content = content.replace(/setPhone\((\w+)\.phone\)/g, "setPhone($1.phone?.replace(/^\\\\+?20/, '0'))");
  content = content.replace(/phone:\s*(\w+)\.phone,/g, "phone: $1.phone?.replace(/^\\\\+?20/, '0'),");

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
}
