const fs = require('fs');
const path = require('path');

const templateDir = path.join(__dirname, '..', 'assets', 'img', 'imgtemplate');
const dbDir = path.join(__dirname, '..', 'assets', 'db');
const manifestPath = path.join(templateDir, 'templates.json');
const metadataPath = path.join(dbDir, 'data.json');
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);

// Define our categories and their directory names
const categoryDirs = {
  'Final Higher Education': 'final-higher-education',
  'Solo Parents Higher Education': 'solo-parents-higher-education',
  'PWD Higher Education': 'pwd-higher-education',
  'Final IPS, PDLs and Working Students': 'final-ips-pdls-working-student'
};

const manifest = {};
const metadata = [];

function loadExistingManifest() {
  if (!fs.existsSync(manifestPath)) return {};

  const rawData = fs.readFileSync(manifestPath, 'utf8').trim();
  if (!rawData) return {};

  const data = JSON.parse(rawData);
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

function buildExistingCategoryMap(existingManifest) {
  const categoryMap = new Map();

  Object.entries(existingManifest).forEach(([categoryName, files]) => {
    if (!Array.isArray(files)) return;

    files.forEach((file) => {
      if (!file) return;

      const normalizedFile = file.replaceAll('\\', '/');
      const filename = path.basename(normalizedFile);

      categoryMap.set(normalizedFile, categoryName);
      categoryMap.set(normalizedFile.toLowerCase(), categoryName);
      categoryMap.set(filename, categoryName);
      categoryMap.set(filename.toLowerCase(), categoryName);
    });
  });

  return categoryMap;
}

function loadExistingMetadata() {
  if (!fs.existsSync(metadataPath)) return new Map();

  const rawData = fs.readFileSync(metadataPath, 'utf8').trim();
  if (!rawData) return new Map();

  const data = JSON.parse(rawData);

  if (Array.isArray(data.templates)) {
    return buildExistingMetadataMap(data.templates.map((template) => [template.file, template]));
  }

  if (data && typeof data === 'object') {
    return buildExistingMetadataMap(Object.entries(data));
  }

  return new Map();
}

function buildExistingMetadataMap(entries) {
  const metadataMap = new Map();

  entries.forEach(([file, metadata]) => {
    if (!file || !metadata) return;

    const normalizedFile = file.replaceAll('\\', '/');
    const filename = path.basename(normalizedFile);

    metadataMap.set(normalizedFile, metadata);
    metadataMap.set(normalizedFile.toLowerCase(), metadata);
    metadataMap.set(filename, metadata);
    metadataMap.set(filename.toLowerCase(), metadata);

    if (metadata.filepath) {
      const normalizedPath = metadata.filepath.replaceAll('\\', '/');
      metadataMap.set(normalizedPath, metadata);
      metadataMap.set(normalizedPath.toLowerCase(), metadata);
      metadataMap.set(path.basename(normalizedPath), metadata);
      metadataMap.set(path.basename(normalizedPath).toLowerCase(), metadata);
    }
  });

  return metadataMap;
}

const existingManifest = loadExistingManifest();
const existingCategoryMap = buildExistingCategoryMap(existingManifest);
const existingMetadata = loadExistingMetadata();

function titleFromFilename(file) {
  const filename = path.basename(file, path.extname(file));
  return filename
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugFromPath(file) {
  return file
    .replace(path.extname(file), '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getImageDimensions(fullPath) {
  const buffer = fs.readFileSync(fullPath);
  const extension = path.extname(fullPath).toLowerCase();

  if (extension === '.png' && buffer.toString('ascii', 1, 4) === 'PNG') {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  }

  return {
    width: null,
    height: null
  };
}

function addMetadata(categoryName, relativeFile) {
  const fullPath = path.join(templateDir, relativeFile);
  const stats = fs.statSync(fullPath);
  const extension = path.extname(relativeFile).toLowerCase();
  const dimensions = getImageDimensions(fullPath);
  const normalizedFile = relativeFile.replaceAll('\\', '/');
  const existing = existingMetadata.get(normalizedFile)
    || existingMetadata.get(normalizedFile.toLowerCase())
    || existingMetadata.get(path.basename(normalizedFile))
    || existingMetadata.get(path.basename(normalizedFile).toLowerCase())
    || {};
  const title = existing.title || titleFromFilename(relativeFile);
  const category = existing.category || categoryName;

  metadata.push({
    id: existing.id || slugFromPath(relativeFile),
    slug: existing.slug || slugFromPath(relativeFile),
    name: existing.name || titleFromFilename(relativeFile),
    title,
    description: existing.description || '',
    category,
    file: normalizedFile,
    path: `assets/img/imgtemplate/${normalizedFile}`,
    filepath: existing.filepath || `assets/img/imgtemplate/${normalizedFile}`,
    directory: path.dirname(relativeFile).replaceAll('\\', '/'),
    filename: path.basename(relativeFile),
    extension: extension.replace('.', ''),
    sizeBytes: stats.size,
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio: dimensions.width && dimensions.height
      ? Number((dimensions.width / dimensions.height).toFixed(4))
      : null
  });
}

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
      files.forEach((file) => addMetadata(categoryName, file));
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

rootFiles.forEach((file) => {
  const existing = existingMetadata.get(file)
    || existingMetadata.get(file.toLowerCase())
    || {};
  const category = existingCategoryMap.get(file)
    || existingCategoryMap.get(file.toLowerCase())
    || existing.category
    || 'General Borders';

  if (!manifest[category]) {
    manifest[category] = [];
  }

  manifest[category].push(file);
  addMetadata(category, file);
});

fs.mkdirSync(dbDir, { recursive: true });
const metadataByFile = metadata.reduce((templates, template) => {
  templates[template.file] = {
    name: template.name,
    title: template.title,
    description: template.description,
    category: template.category,
    filepath: template.filepath,
    id: template.id,
    slug: template.slug,
    filename: template.filename,
    extension: template.extension,
    sizeBytes: template.sizeBytes,
    width: template.width,
    height: template.height,
    aspectRatio: template.aspectRatio
  };

  return templates;
}, {});

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(metadataPath, `${JSON.stringify(metadataByFile, null, 2)}\n`);

console.log(`Generated template manifest with ${metadata.length} templates.`);
console.log(`Generated template metadata at ${path.relative(process.cwd(), metadataPath)}.`);
