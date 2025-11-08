# PWA App Icon Generation Guide

This guide explains how to generate app icons for Progressive Web App (PWA) installation with a white background and your logo.

## Quick Start

### Option 1: Using the Automated Script (Recommended)

1. **Install sharp library** (if not already installed):
   ```bash
   npm install sharp
   ```

2. **Run the icon generation script**:
   ```bash
   node scripts/generate-app-icons.js
   ```

3. **Verify the generated icons**:
   - Check the `public/` directory
   - You should see icons: `icon-72x72.png`, `icon-96x96.png`, etc.
   - Each icon should have a white background with your logo centered

### Option 2: Manual Generation

If you prefer to create icons manually or use a different tool:

1. **Required icon sizes**:
   - 72x72
   - 96x96
   - 128x128
   - 144x144
   - 152x152
   - 192x192
   - 384x384
   - 512x512

2. **Icon specifications**:
   - **Background**: White (#FFFFFF)
   - **Logo**: Centered, 80% of icon size
   - **Format**: PNG
   - **Purpose**: Any (maskable icons)

3. **Tools you can use**:
   - **Online**: [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
   - **Photoshop/GIMP**: Create canvas with white background, place logo
   - **Figma**: Design icons and export as PNG
   - **ImageMagick**: Command-line tool for batch processing

## Icon Design Guidelines

### Best Practices

1. **White Background**: All icons must have a solid white background (#FFFFFF)
2. **Logo Size**: Logo should be approximately 80% of the icon size, centered
3. **Padding**: Leave 10% padding on all sides
4. **Format**: PNG format with transparency (though background should be white)
5. **Quality**: High quality, no compression artifacts

### Example Structure

```
Icon (512x512)
┌─────────────────────────┐
│  (10% padding)          │
│  ┌───────────────────┐ │
│  │                   │ │
│  │   Your Logo       │ │  (80% of icon size)
│  │   (centered)      │ │
│  │                   │ │
│  └───────────────────┘ │
│  (10% padding)          │
└─────────────────────────┘
```

## Verification

After generating icons, verify:

1. **File names match manifest.json**:
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png`
   - `icon-384x384.png`
   - `icon-512x512.png`

2. **Files are in public directory**:
   ```
   public/
   ├── icon-72x72.png
   ├── icon-96x96.png
   ├── icon-128x128.png
   ├── icon-144x144.png
   ├── icon-152x152.png
   ├── icon-192x192.png
   ├── icon-384x384.png
   └── icon-512x512.png
   ```

3. **Icons have white background**:
   - Open each icon file
   - Verify background is solid white
   - Logo should be clearly visible and centered

## Troubleshooting

### Icons not showing in PWA install prompt

1. **Check manifest.json**: Ensure all icon paths are correct
2. **Verify file paths**: Icons must be in `/public` directory
3. **Check file sizes**: Ensure files are not corrupted
4. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
5. **Check console errors**: Look for 404 errors for icon files

### Icons look blurry

1. **Use high-resolution source**: Start with a high-quality logo
2. **Avoid upscaling**: Don't scale up small images
3. **Use vector source**: If possible, use SVG logo and convert to PNG

### Script fails to run

1. **Install dependencies**: `npm install sharp`
2. **Check Node.js version**: Requires Node.js 12+
3. **Verify logo path**: Ensure `public/logo.png` exists
4. **Check permissions**: Ensure write permissions for `public/` directory

## Testing PWA Installation

1. **Build and run your app**:
   ```bash
   npm run build
   npm start
   ```

2. **Open in browser** (Chrome/Edge recommended):
   - Navigate to your app
   - Open DevTools → Application → Manifest
   - Verify icons are listed correctly

3. **Test install prompt**:
   - On mobile: Look for "Add to Home Screen" prompt
   - On desktop: Look for install icon in address bar
   - Install the app and verify icon appears correctly

## Additional Resources

- [PWA Builder](https://www.pwabuilder.com/) - PWA asset generator
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

