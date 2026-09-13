const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client', 'src', 'pages', 'admin');

function traverse(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let modified = false;
      
      if (content.includes('res.data?.success')) {
        content = content.replace(/res\.data\?\.success/g, 'res.success');
        modified = true;
      }
      
      if (content.includes('res.data.data.')) {
        content = content.replace(/res\.data\.data\./g, 'res.data.');
        modified = true;
      }
      
      if (content.includes('res.data?.data')) {
        content = content.replace(/res\.data\?\.data/g, 'res.data');
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

traverse(dir);
console.log('Done!');
