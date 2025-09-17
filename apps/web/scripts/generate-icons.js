// Icon generation script
// This creates basic placeholder icons for PWA functionality
// In production, you should use proper icon generation tools

const fs = require('fs');
const path = require('path');

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const appleTouchSizes = [120, 152, 167, 180];

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create basic SVG template
const createSVGIcon = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.23}" fill="url(#bg)"/>
  <circle cx="${size/2}" cy="${size * 0.39}" r="${size * 0.16}" fill="white" opacity="0.9"/>
  <rect x="${size * 0.34}" y="${size * 0.63}" width="${size * 0.31}" height="${size * 0.04}" rx="${size * 0.02}" fill="white" opacity="0.8"/>
  <rect x="${size * 0.34}" y="${size * 0.70}" width="${size * 0.23}" height="${size * 0.04}" rx="${size * 0.02}" fill="white" opacity="0.7"/>
  <rect x="${size * 0.34}" y="${size * 0.78}" width="${size * 0.27}" height="${size * 0.04}" rx="${size * 0.02}" fill="white" opacity="0.6"/>
  <path d="M${size * 0.39} ${size * 0.35} L${size * 0.45} ${size * 0.41} L${size * 0.55} ${size * 0.31}" stroke="white" stroke-width="${size * 0.016}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

console.log('Generating PWA icons...');

// Generate standard icons
iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png.svg`), svgContent);
  console.log(`Created icon-${size}x${size}.png.svg`);
});

// Generate Apple Touch icons
appleTouchSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  fs.writeFileSync(path.join(iconsDir, `touch-icon-${size}x${size}.png.svg`), svgContent);
  console.log(`Created touch-icon-${size}x${size}.png.svg`);
});

// Create favicon sizes
[16, 32].forEach(size => {
  const svgContent = createSVGIcon(size);
  fs.writeFileSync(path.join(iconsDir, `favicon-${size}x${size}.png.svg`), svgContent);
  console.log(`Created favicon-${size}x${size}.png.svg`);
});

console.log('Icon generation complete!');
console.log('Note: These are SVG placeholders. For production, convert to PNG using imagemagick or similar tool.');