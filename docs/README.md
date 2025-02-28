# Multiverso - GitHub Pages Deployment

This directory contains the files for the GitHub Pages deployment of the Multiverso project.

## Project Overview
Multiverso is an interactive 3D web experience built with Three.js that allows users to explore a virtual space environment. The project features a navigable spaceship, celestial bodies including Earth and the Sun, a lunar terrain, and a special portal that grants access to exclusive areas for users with a Multiverso Pass Bitcoin Ordinals Collection.

## Bitcoin Ordinals Access
The exclusive areas of the Multiverso are accessible only to holders of the Multiverso Pass Bitcoin Ordinals Collection. These NFTs on the Bitcoin blockchain grant access to:
- Educational content and classes
- Exclusive terrain and experiences
- Special features and interactions

## Earth Texture Issue

If the Earth is not rendering correctly on GitHub Pages, please ensure the following:

1. **Add Earth Texture Files**: The following texture files need to be added to the `textures` directory:
   - `earth_daymap.jpg`
   - `earth_bumpmap.jpg`
   - `earth_specular.jpg`
   - `earth_normal.jpg`
   - `earth_clouds.jpg`

   You can download these files from sources like [Solar System Scope](https://www.solarsystemscope.com/textures/) or [NASA Visible Earth](https://visibleearth.nasa.gov/).

2. **Verify Path Resolution**: The texture paths in `js/main.js` should use relative paths:
   ```javascript
   map: textureLoader.load('./textures/earth_daymap.jpg')
   ```

3. **Base URL Configuration**: The `index.html` file should include a base URL tag:
   ```html
   <base href="./">
   ```

## File Structure
Ensure the file structure matches the expected paths in the code:
```
docs/
├── index.html
├── js/
│   └── main.js
└── textures/
    ├── earth_daymap.jpg
    ├── earth_bumpmap.jpg
    ├── earth_specular.jpg
    ├── earth_normal.jpg
    └── earth_clouds.jpg
```
