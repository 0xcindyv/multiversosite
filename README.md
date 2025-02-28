# Multiverso - 3D Interactive Space Experience

## Overview
Multiverso is an interactive 3D web experience built with Three.js that allows users to explore a virtual space environment. The project features a navigable spaceship, celestial bodies including Earth and the Sun, a lunar terrain, and a special portal that grants access to exclusive areas for users with a Multiverso Pass Bitcoin Ordinals Collection.

## Features
- Interactive 3D space environment
- Controllable spaceship with realistic physics
- Detailed Earth model with atmosphere and cloud layers
- Dynamic Sun with animated surface effects
- Lunar terrain with collision detection
- Token-gated exclusive areas accessible via Bitcoin Ordinals Collection that provides access to educational content and classes
- Multilingual support
- Desktop-only experience (not currently available for mobile devices)

## Technologies Used
- Three.js for 3D rendering
- JavaScript for application logic
- HTML/CSS for UI elements
- Web3 integration for Bitcoin Ordinals blockchain connectivity

## Local Development
To run the project locally:

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and navigate to the local server address (typically http://localhost:8080)

## GitHub Pages Deployment
The project is deployed on GitHub Pages and can be accessed at the repository's GitHub Pages URL.

### Known Issues with GitHub Pages Deployment
The Earth planet may not render correctly on GitHub Pages while it works fine in local development. This is due to missing texture files and path resolution issues.

#### Required Texture Files
The Earth model requires the following texture files:
- `earth_daymap.jpg` - The main Earth texture
- `earth_bumpmap.jpg` - For surface elevation details
- `earth_specular.jpg` - For light reflection properties
- `earth_normal.jpg` - For detailed surface normals
- `earth_clouds.jpg` - For the cloud layer

#### Solutions:
1. **Add Missing Texture Files**: Download Earth texture files from sources like [Solar System Scope](https://www.solarsystemscope.com/textures/) or [NASA Visible Earth](https://visibleearth.nasa.gov/) and add them to the `docs/textures` directory.

2. **Path Resolution**: The texture files are being loaded with absolute paths (`/textures/earth_daymap.jpg`), which works in local development but may not work on GitHub Pages. Update the paths in `main.js` to use relative paths:

   ```javascript
   // Change from:
   map: textureLoader.load('/textures/earth_daymap.jpg')
   
   // To:
   map: textureLoader.load('./textures/earth_daymap.jpg')
   ```

3. **Base URL Configuration**: Add a base URL tag in your HTML to help with path resolution:

   ```html
   <base href="./">
   ```

4. **Verify File Structure**: Ensure the file structure in the `docs` directory matches the expected paths in the code:
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

## Project Structure
- `/public` - Development files
  - `/js` - JavaScript files
  - `/textures` - Texture files for 3D models
- `/docs` - Production files for GitHub Pages deployment

## Controls
- **W/A/S/D or Arrow Keys**: Move the spaceship
- **Space**: Ascend
- **Shift**: Descend
- **Mouse**: Look around
- **Click**: Interact with objects

## Bitcoin Ordinals Access
The exclusive areas of the Multiverso are accessible only to holders of the Multiverso Pass Bitcoin Ordinals Collection. These NFTs on the Bitcoin blockchain grant access to:
- Educational content and classes
- Exclusive terrain and experiences
- Special features and interactions

## Device Compatibility
Currently, Multiverso is designed for desktop browsers only. Mobile support is not available at this time.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the ISC License. 