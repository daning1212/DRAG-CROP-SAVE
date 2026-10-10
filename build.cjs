const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
let page = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
page = page.replace('<link rel="stylesheet" href="style.css">', '<style>' + fs.readFileSync(path.join(root, 'dist/style.css'), 'utf8') + '</style>');
page = page.replace('<script src="app.js"></script>', '<script>' + fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8') + '</script>');
fs.writeFileSync(path.join(root, 'index.html'), page);
fs.writeFileSync(path.join(root, '영상 크롭.html'), page);
console.log('Built index.html and 영상 크롭.html');
