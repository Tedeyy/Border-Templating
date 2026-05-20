const fs = require('fs');
const path = require('path');

const templateDir = path.join(__dirname, '..', 'assets', 'img', 'imgtemplate');
const manifestPath = path.join(templateDir, 'templates.json');
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);

// Define our categories and their directory names
const categoryDirs = {
  'Final Higher Education': 'final-higher-education',
  'Solo Parents Higher Education': 'solo-parents-higher-education',
  'PWD Higher Education': 'pwd-higher-education',
  'Final IPS, PDLs and Working Students': 'final-ips-pdls-working-student'
};

const manifest = {};

// 1. Scan category subdirectories
Object.entries(categoryDirs).forEach(([categoryName, dirName]) => {
  const fullPath = path.join(templateDir, dirName);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    const files = fs.readdirSync(fullPath)
      .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
      .map((file) => `${dirName}/${file}`)
      .sort((a, b) => a.localeCompare(b));
    
    if (files.length > 0) {
      manifest[categoryName] = files;
    }
  }
});

// 2. Scan root of template directory for general files
const rootFiles = fs.readdirSync(templateDir)
  .filter((file) => {
    const fullPath = path.join(templateDir, file);
    return fs.statSync(fullPath).isFile() && imageExtensions.has(path.extname(file).toLowerCase());
  })
  .sort((a, b) => a.localeCompare(b));

if (rootFiles.length > 0) {
  manifest['General Borders'] = rootFiles;
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated template manifest with ${Object.values(manifest).flat().length} templates.`);
