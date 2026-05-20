const TEMPLATE_DIR = 'assets/img/imgtemplate/';
const TEMPLATE_MANIFEST = `${TEMPLATE_DIR}templates.json`;
const TEMPLATE_METADATA = 'assets/db/data.json';
const TEMPLATE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

const canvas = document.querySelector('#previewCanvas');
const ctx = canvas.getContext('2d');
const photoInput = document.querySelector('#photoInput');
const photoStatus = document.querySelector('#photoStatus');
const removePhotoBtn = document.querySelector('#removePhotoBtn');
const templateSelect = document.querySelector('#templateSelect');
const templateTitle = document.querySelector('#templateTitle');
const templateDescription = document.querySelector('#templateDescription');
const photoSettings = document.querySelector('#photoSettings');
const zoomRange = document.querySelector('#zoomRange');
const zoomValue = document.querySelector('#zoomValue');
const resetZoomBtn = document.querySelector('#resetZoomBtn');
const xOffsetRange = document.querySelector('#xOffsetRange');
const xOffset = document.querySelector('#xOffset');
const xOffsetValue = document.querySelector('#xOffsetValue');
const yOffsetRange = document.querySelector('#yOffsetRange');
const yOffset = document.querySelector('#yOffset');
const yOffsetValue = document.querySelector('#yOffsetValue');
const resetPositionBtn = document.querySelector('#resetPositionBtn');
const fitBtn = document.querySelector('#fitBtn');
const fillBtn = document.querySelector('#fillBtn');
const centerBtn = document.querySelector('#centerBtn');
const downloadBtn = document.querySelector('#downloadBtn');
const mobileDownloadBtn = document.querySelector('#mobileDownloadBtn');
const downloadButtons = [downloadBtn, mobileDownloadBtn].filter(Boolean);

const state = {
  photo: null,
  template: null,
  metadata: new Map(),
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function templateNameFromFile(file) {
  const metadata = getTemplateMetadata(file);
  if (metadata && metadata.name) return metadata.name;

  const filename = file.split('/').pop();
  const name = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  return name.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function templateFilename(file) {
  return file.split('/').pop();
}

function templateTitleFromFile(file) {
  const metadata = getTemplateMetadata(file);
  return metadata && metadata.title ? metadata.title : templateNameFromFile(file);
}

function templateDescriptionFromFile(file) {
  const metadata = getTemplateMetadata(file);
  return metadata && metadata.description
    ? metadata.description
    : 'No description available for this border template.';
}

function getTemplateMetadata(file) {
  const filename = templateFilename(file);
  const normalizedFile = file.replaceAll('\\', '/');
  const normalizedFileLowercase = normalizedFile.toLowerCase();

  return state.metadata.get(normalizedFile)
    || state.metadata.get(normalizedFileLowercase)
    || state.metadata.get(filename)
    || state.metadata.get(filename.toLowerCase())
    || null;
}

function normalizeTemplateFile(href) {
  const url = new URL(href, window.location.href);
  const filename = decodeURIComponent(url.pathname.split('/').pop());
  return filename;
}

async function discoverTemplatesFromManifest() {
  const response = await fetch(TEMPLATE_MANIFEST, { cache: 'no-store' });
  if (!response.ok) return null;

  const data = await response.json();
  return data;
}

async function loadTemplateMetadata() {
  const response = await fetch(TEMPLATE_METADATA, { cache: 'no-store' });
  if (!response.ok) return;

  const data = await response.json();

  if (data && Array.isArray(data.templates)) {
    state.metadata = buildMetadataMap(data.templates.map((template) => [template.file, template]));
    return;
  }

  if (data && typeof data === 'object') {
    state.metadata = buildMetadataMap(Object.entries(data).map(([file, metadata]) => [
      file,
      {
        ...metadata,
        file,
      },
    ]));
  }
}

function buildMetadataMap(entries) {
  const metadataMap = new Map();

  entries.forEach(([file, metadata]) => {
    if (!file || !metadata) return;

    const normalizedFile = file.replaceAll('\\', '/');
    const filename = templateFilename(normalizedFile);

    metadataMap.set(normalizedFile, metadata);
    metadataMap.set(normalizedFile.toLowerCase(), metadata);
    metadataMap.set(filename, metadata);
    metadataMap.set(filename.toLowerCase(), metadata);

    if (metadata.filepath) {
      const normalizedPath = metadata.filepath.replaceAll('\\', '/');
      metadataMap.set(normalizedPath, metadata);
      metadataMap.set(normalizedPath.toLowerCase(), metadata);
      metadataMap.set(templateFilename(normalizedPath), metadata);
      metadataMap.set(templateFilename(normalizedPath).toLowerCase(), metadata);
    }
  });

  return metadataMap;
}

async function discoverTemplatesFromDirectory() {
  const response = await fetch(TEMPLATE_DIR);
  if (!response.ok) return [];

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const files = [...doc.querySelectorAll('a')]
    .map((link) => normalizeTemplateFile(link.getAttribute('href')))
    .filter((file) => TEMPLATE_EXTENSIONS.some((extension) => file.toLowerCase().endsWith(extension)));

  return [...new Set(files)].sort((a, b) => a.localeCompare(b));
}

async function discoverTemplates() {
  const manifestData = await discoverTemplatesFromManifest();

  if (manifestData && typeof manifestData === 'object' && !Array.isArray(manifestData)) {
    return manifestData;
  }

  // Fallback to array if it is the old array format or directory listing
  const filesArray = Array.isArray(manifestData) ? manifestData : await discoverTemplatesFromDirectory();

  // Convert flat files array to category map
  const categories = {
    'Final Higher Education': [],
    'Solo Parents Higher Education': [],
    'PWD Higher Education': [],
    'Final IPS, PDLs and Working Students': [],
    'General Borders': []
  };

  filesArray.forEach((file) => {
    const category = getCategoryFromFile(file);
    categories[category].push(file);
  });

  return categories;
}

function getCategoryFromFile(file) {
  const lowercase = file.toLowerCase();

  if (lowercase.includes('solo') || lowercase.includes('parent')) {
    return 'Solo Parents Higher Education';
  }
  if (lowercase.includes('pwd')) {
    return 'PWD Higher Education';
  }
  if (lowercase.includes('ips') || lowercase.includes('pdl') || lowercase.includes('working') || lowercase.includes('student')) {
    return 'Final IPS, PDLs and Working Students';
  }
  if (lowercase.includes('higher') || lowercase.includes('education') || lowercase.includes('final') || lowercase.includes('he')) {
    return 'Final Higher Education';
  }

  return 'General Borders';
}

function populateTemplates(categories) {
  templateSelect.innerHTML = '';

  const totalFiles = Array.isArray(categories)
    ? categories.length
    : Object.values(categories).flat().length;

  if (!totalFiles) {
    templateSelect.append(new Option('No templates detected', ''));
    templateSelect.disabled = true;
    updateTemplatePreview('');
    return;
  }

  templateSelect.disabled = false;

  let firstAvailableFile = '';

  if (Array.isArray(categories)) {
    categories.forEach((file) => {
      if (!firstAvailableFile) firstAvailableFile = file;
      templateSelect.append(new Option(templateFilename(file), file));
    });
  } else {
    Object.entries(categories).forEach(([categoryName, categoryFiles]) => {
      if (categoryFiles.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoryName;

        categoryFiles.forEach((file) => {
          if (!firstAvailableFile) {
            firstAvailableFile = file;
          }
          optgroup.append(new Option(templateFilename(file), file));
        });

        templateSelect.appendChild(optgroup);
      }
    });
  }

  if (firstAvailableFile) {
    updateTemplatePreview(firstAvailableFile);
    setTemplate(firstAvailableFile);
  }
}

function updateTemplatePreview(file) {
  if (!file) {
    templateTitle.textContent = 'No template selected';
    templateDescription.textContent = 'Choose a border to view its details.';
    return;
  }

  templateTitle.textContent = templateTitleFromFile(file);
  templateDescription.textContent = templateDescriptionFromFile(file);
}

function drawPlaceholder() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#667085';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 34px Arial, sans-serif';
  ctx.fillText('NBSC SAS Border Templating System', canvas.width / 2, canvas.height / 2 - 22);
  ctx.font = '700 24px Arial, sans-serif';
  ctx.fillText('Upload a photo to begin', canvas.width / 2, canvas.height / 2 + 28);
}

function imageRect(mode = 'contain') {
  if (!state.photo) return null;

  const canvasRatio = canvas.width / canvas.height;
  const imageRatio = state.photo.width / state.photo.height;
  const matchWidth = mode === 'cover' ? imageRatio < canvasRatio : imageRatio > canvasRatio;
  const baseWidth = matchWidth ? canvas.width : canvas.height * imageRatio;
  const baseHeight = matchWidth ? canvas.width / imageRatio : canvas.height;
  const width = baseWidth * state.zoom;
  const height = baseHeight * state.zoom;

  return {
    x: (canvas.width - width) / 2 + state.offsetX,
    y: (canvas.height - height) / 2 + state.offsetY,
    width,
    height,
  };
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.photo) {
    const rect = imageRect('cover');
    ctx.drawImage(state.photo, rect.x, rect.y, rect.width, rect.height);
  }

  if (state.template) {
    ctx.drawImage(state.template, 0, 0, canvas.width, canvas.height);
  }

  if (!state.photo && !state.template) {
    drawPlaceholder();
  }

  downloadButtons.forEach((button) => {
    button.disabled = !state.photo;
  });
}

function syncInputs() {
  zoomRange.value = state.zoom;
  zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
  xOffsetRange.value = Math.round(state.offsetX);
  xOffset.value = Math.round(state.offsetX);
  xOffsetValue.textContent = `${Math.round(state.offsetX)} px`;
  yOffsetRange.value = Math.round(state.offsetY);
  yOffset.value = Math.round(state.offsetY);
  yOffsetValue.textContent = `${Math.round(state.offsetY)} px`;
}

function setZoom(value) {
  state.zoom = Number(value);
  syncInputs();
  render();
}

function setXOffset(value) {
  state.offsetX = Number(value);
  syncInputs();
  render();
}

function setYOffset(value) {
  state.offsetY = Number(value);
  syncInputs();
  render();
}

async function setTemplate(file) {
  if (!file) {
    state.template = null;
    updateTemplatePreview('');
    render();
    return;
  }

  updateTemplatePreview(file);
  state.template = await loadImage(`${TEMPLATE_DIR}${file}`);
  render();
}

function fitPhoto(mode) {
  if (!state.photo) return;

  const canvasRatio = canvas.width / canvas.height;
  const imageRatio = state.photo.width / state.photo.height;
  const coverScale = imageRatio < canvasRatio
    ? canvas.width / state.photo.width
    : canvas.height / state.photo.height;
  const containScale = imageRatio > canvasRatio
    ? canvas.width / state.photo.width
    : canvas.height / state.photo.height;

  state.zoom = mode === 'cover' ? 1 : containScale / coverScale;
  state.offsetX = 0;
  state.offsetY = 0;
  syncInputs();
  render();
}

photoInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  const objectUrl = URL.createObjectURL(file);
  state.photo = await loadImage(objectUrl);
  URL.revokeObjectURL(objectUrl);
  photoStatus.textContent = file.name;
  photoSettings.hidden = false;
  removePhotoBtn.hidden = false;
  document.body.classList.add('photo-loaded');
  fitPhoto('cover');
});

removePhotoBtn.addEventListener('click', () => {
  state.photo = null;
  state.zoom = 1;
  state.offsetX = 0;
  state.offsetY = 0;
  photoInput.value = '';
  photoStatus.textContent = 'No photo selected';
  photoSettings.hidden = true;
  removePhotoBtn.hidden = true;
  document.body.classList.remove('photo-loaded');
  syncInputs();
  render();
});

templateSelect.addEventListener('change', (event) => {
  setTemplate(event.target.value);
});

zoomRange.addEventListener('input', (event) => {
  setZoom(event.target.value);
});

resetZoomBtn.addEventListener('click', () => {
  setZoom(1);
});

xOffsetRange.addEventListener('input', (event) => {
  setXOffset(event.target.value);
});

xOffset.addEventListener('input', (event) => {
  setXOffset(event.target.value);
});

yOffsetRange.addEventListener('input', (event) => {
  setYOffset(event.target.value);
});

yOffset.addEventListener('input', (event) => {
  setYOffset(event.target.value);
});

fitBtn.addEventListener('click', () => fitPhoto('contain'));
fillBtn.addEventListener('click', () => fitPhoto('cover'));

function resetPosition() {
  state.offsetX = 0;
  state.offsetY = 0;
  syncInputs();
  render();
}

resetPositionBtn.addEventListener('click', resetPosition);
centerBtn.addEventListener('click', resetPosition);

syncInputs();

function downloadImage() {
  const link = document.createElement('a');
  link.download = 'border-template.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

downloadButtons.forEach((button) => {
  button.addEventListener('click', downloadImage);
});

async function init() {
  try {
    await loadTemplateMetadata();
    const files = await discoverTemplates();
    populateTemplates(files);
  } catch (error) {
    populateTemplates([]);
  }

  render();
}

init();
