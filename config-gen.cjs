const fs = require('fs');
const path = require('path');

// Helper to get title from filename or folder name
function prettify(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\.md$/i, '')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Recursively build nav structure
function buildNav(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  // Sort: folders first, then files
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });
  const nav = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // skip hidden
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(base, entry.name);
    if (entry.isDirectory()) {
      const children = buildNav(fullPath, relPath);
      if (children.length > 0) {
        nav.push({ [prettify(entry.name)]: children });
      }
    } else if (entry.name.endsWith('.md')) {
      nav.push({ [prettify(entry.name)]: relPath.replace(/\\/g, '/') });
    }
  }
  return nav;
}

// Print YAML for nav
function printYAML(nav, indent = 0) {
  const pad = '  '.repeat(indent);
  for (const item of nav) {
    const key = Object.keys(item)[0];
    const value = item[key];
    if (Array.isArray(value)) {
      console.log(`${pad}- ${key}:`);
      printYAML(value, indent + 1);
    } else {
      console.log(`${pad}- ${key}: ${value}`);
    }
  }
}

// Main
const docsDir = path.join(__dirname, 'docs');
if (!fs.existsSync(docsDir)) {
  console.error('docs/ directory not found');
  process.exit(1);
}
const nav = buildNav(docsDir);
console.log('nav:');
printYAML(nav, 1);
