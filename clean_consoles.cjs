const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove console.log entirely
  content = content.replace(/^[ \t]*console\.log\(.*?\);?\s*$/gm, '');
  
  // Replace console.error with a comment or remove entirely
  // It's safer to just remove the console.error lines entirely
  content = content.replace(/^[ \t]*console\.error\(.*?\);?\s*$/gm, '');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed: ${filePath}`);
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
console.log('Console statements cleaned.');
