import * as THREE from 'three';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add orange glow to background
const orangeLight = new THREE.PointLight(0xD2691E, 3, 3000);
orangeLight.position.set(0, -500, -1000);
scene.add(orangeLight);

const orangeAmbient = new THREE.AmbientLight(0xD2691E, 0.3);
scene.add(orangeAmbient);

// Clock for controls
const clock = new THREE.Clock();

// Scene settings
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.0002);

// Lighting setup
const ambientLight = new THREE.AmbientLight(0x6666ff, 0.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xD2691E, 2);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Adiciona luzes místicas
const purpleLight = new THREE.PointLight(0x800080, 1, 2000);
purpleLight.position.set(-1000, 500, -1000);
scene.add(purpleLight);

const blueLight = new THREE.PointLight(0x0000ff, 1, 2000);
blueLight.position.set(1000, 500, -1000);
scene.add(blueLight);

// Camera initial position
camera.position.set(0, 1000, 3000);
camera.lookAt(0, 0, 0);

// First Person Controls
const controls = new FirstPersonControls(camera, renderer.domElement);
controls.movementSpeed = 400;
controls.lookSpeed = 0.1;
controls.lookVertical = true;
controls.constrainVertical = true;
controls.verticalMin = Math.PI / 4;
controls.verticalMax = Math.PI * 3 / 4;

// Create spaceship texture
function createSpaceshipTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const context = canvas.getContext('2d');

    // Create gradient background
    const gradient = context.createLinearGradient(0, 0, 200, 200);
    gradient.addColorStop(0, '#FF0000'); // Vermelho
    gradient.addColorStop(0.33, '#00FF00'); // Verde
    gradient.addColorStop(0.66, '#0000FF'); // Azul
    gradient.addColorStop(1, '#800080'); // Roxo
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 200, 200);

    // Create network pattern with black lines
    context.strokeStyle = '#000000'; // Preto para as linhas
    context.lineWidth = 1;

    // Generate nodes in exact grid pattern
    const nodes = [];
    const cols = 8;
    const rows = 10;
    for (let x = 0; x <= cols; x++) {
        for (let y = 0; y <= rows; y++) {
            const px = (x / cols) * 200 + (Math.random() * 20 - 10);
            const py = (y / rows) * 200 + (Math.random() * 20 - 10);
            nodes.push({ x: px, y: py });
            
            // Draw nodes in black
            context.fillStyle = '#000000';
            context.beginPath();
            context.arc(px, py, 2.5, 0, Math.PI * 2);
            context.fill();
        }
    }

    // Connect nearby nodes
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 50) {
                context.beginPath();
                context.moveTo(nodes[i].x, nodes[i].y);
                context.lineTo(nodes[j].x, nodes[j].y);
                context.stroke();
            }
        }
    }

    return new THREE.CanvasTexture(canvas);
}

// Create spaceship with exact proportions from original
function createSpaceship() {
    const texture = createSpaceshipTexture();
    const group = new THREE.Group();

    // Main body - ellipsoid with exact proportions
    const bodyGeometry = new THREE.SphereGeometry(30, 32, 16);
    bodyGeometry.scale(1, 0.25, 1);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 30
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);

    // Cúpula de vidro alaranjado
    const domeGeometry = new THREE.SphereGeometry(15, 32, 16);
    const domeMaterial = new THREE.MeshPhongMaterial({
        color: 0xD2691E, // Laranja avermelhado
        transparent: true,
        opacity: 0.3,
        shininess: 100,
        specular: 0xffffff,
        envMap: null, // Adiciona reflexo
        refractionRatio: 0.98 // Adiciona efeito de refração
    });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 8;
    group.add(dome);

    // Suportes laterais (marrom com detalhes azul escuro)
    [-12, 12].forEach(x => {
        // Base marrom
        const supportGeometry = new THREE.BoxGeometry(4, 16, 4);
        const supportMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B4513, // Marrom
            shininess: 30
        });
        const support = new THREE.Mesh(supportGeometry, supportMaterial);
        support.position.set(x, 4, -20);
        group.add(support);

        // Detalhes azul escuro
        const detailGeometry = new THREE.BoxGeometry(4.5, 2, 4.5);
        const detailMaterial = new THREE.MeshPhongMaterial({
            color: 0x00008B, // Azul escuro
            shininess: 30
        });
        const detail = new THREE.Mesh(detailGeometry, detailMaterial);
        detail.position.set(x, 8, -20);
        group.add(detail);
    });

    // Propulsores pretos
    [-12, 12].forEach(x => {
        const thrusterGeometry = new THREE.CylinderGeometry(2, 2, 8, 16);
        const thrusterMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x000000, // Preto
            shininess: 30
        });
        const thruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
        thruster.position.set(x, 8, -36);
        thruster.rotation.x = Math.PI / 2;
        group.add(thruster);

        // Esfera preta do propulsor
        const glowGeometry = new THREE.SphereGeometry(3, 16, 16);
        const glowMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000, // Preto
            emissive: 0xD2691E, // Brilho laranja avermelhado
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.8
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(x, 8, -40);
        group.add(glow);

        // Luz do propulsor (laranja avermelhado)
        const thrusterLight = new THREE.PointLight(0xD2691E, 2, 20);
        thrusterLight.position.set(x, 8, -40);
        group.add(thrusterLight);
    });

    group.scale.set(3, 3, 3);
    scene.add(group);
    return group;
}

// Stars
function createStars() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    
    // Reduz quantidade de estrelas para 25000
    for (let i = 0; i < 25000; i++) {
        const x = THREE.MathUtils.randFloatSpread(12000);
        const y = THREE.MathUtils.randFloatSpread(12000);
        const z = THREE.MathUtils.randFloatSpread(12000);
        vertices.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    // Cria múltiplas camadas de estrelas para efeito de profundidade
    const smallStars = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 1.5, // Aumenta um pouco o tamanho para compensar a menor quantidade
            sizeAttenuation: true
        })
    );
    
    const mediumStars = new THREE.Points(
        geometry.clone(),
        new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 2.5,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8
        })
    );
    
    const largeStars = new THREE.Points(
        geometry.clone(),
        new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 3.5,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.6
        })
    );
    
    const glowingStars = new THREE.Points(
        geometry.clone(),
        new THREE.PointsMaterial({
            color: 0x6666ff,
            size: 4.5,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        })
    );

    // Adiciona apenas uma camada extra de estrelas
    const extraStars = smallStars.clone();
    extraStars.position.set(6000, -6000, -6000);

    scene.add(smallStars);
    scene.add(mediumStars);
    scene.add(largeStars);
    scene.add(glowingStars);
    scene.add(extraStars);
}

// Generate height data
function generateHeight(width, height) {
    let seed = Math.PI / 4;
    window.Math.random = function() {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    const size = width * height;
    const data = new Uint8Array(size);
    const perlin = new ImprovedNoise();
    const z = Math.random() * 100;

    let quality = 1;

    for (let j = 0; j < 4; j++) {
        for (let i = 0; i < size; i++) {
            const x = i % width;
            const y = ~~(i / width);
            data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);
        }
        quality *= 5;
    }

    return data;
}

// Generate texture
function generateTexture(data, width, height) {
    const vector3 = new THREE.Vector3(0, 0, 0);
    const sun = new THREE.Vector3(1, 1, 1);
    sun.normalize();

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const imageData = image.data;

    for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
        vector3.x = data[j - 2] - data[j + 2];
        vector3.y = 2;
        vector3.z = data[j - width * 2] - data[j + width * 2];
        vector3.normalize();

        const shade = vector3.dot(sun);

        // Lunar surface colors (grayer than the original)
        imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
        imageData[i + 1] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
        imageData[i + 2] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
        imageData[i + 3] = 255;
    }

    context.putImageData(image, 0, 0);

    const canvasScaled = document.createElement('canvas');
    canvasScaled.width = width * 4;
    canvasScaled.height = height * 4;

    const contextScaled = canvasScaled.getContext('2d');
    contextScaled.scale(4, 4);
    contextScaled.drawImage(canvas, 0, 0);

    const imageScaled = contextScaled.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
    const imageDataScaled = imageScaled.data;

    // Add noise to the texture
    for (let i = 0, l = imageDataScaled.length; i < l; i += 4) {
        const v = ~~(Math.random() * 5);
        imageDataScaled[i] += v;
        imageDataScaled[i + 1] += v;
        imageDataScaled[i + 2] += v;
    }

    contextScaled.putImageData(imageScaled, 0, 0);
    return canvasScaled;
}

// Initialize scene
let spaceship;
let lunarTerrain; // Referência para o terreno lunar

function init() {
    try {
        createStars();
        lunarTerrain = createLunarTerrain();
        spaceship = createSpaceship();
        const earth = createEarth();
        const sun = createSun();
        
        // Start animation loop
        animate();
        
        console.log("Scene initialized successfully");
    } catch (error) {
        console.error("Error initializing scene:", error);
    }
}

// Função para detectar altura do terreno
const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0);
const targetHeight = 300;
const minHeight = 200;
const smoothFactor = 0.1;
const forwardRaycaster = new THREE.Raycaster();

function getTerrainHeight(position) {
    raycaster.set(position, downVector);
    const intersects = raycaster.intersectObject(lunarTerrain);
    
    if (intersects.length > 0) {
        return intersects[0].point.y;
    }
    return 0;
}

function checkTerrainCollision(position, direction) {
    // Verifica colisão frontal
    forwardRaycaster.set(position, direction);
    const frontIntersects = forwardRaycaster.intersectObject(lunarTerrain);
    
    // Verifica colisão com o solo
    raycaster.set(position, downVector);
    const downIntersects = raycaster.intersectObject(lunarTerrain);
    
    return {
        front: frontIntersects.length > 0 && frontIntersects[0].distance < 200,
        ground: downIntersects.length > 0 && downIntersects[0].distance < minHeight
    };
}

// Create lunar terrain
function createLunarTerrain() {
    const worldWidth = 256;
    const worldDepth = 256;
    
    const data = generateHeight(worldWidth, worldDepth);
    
    const geometry = new THREE.PlaneGeometry(15000, 15000, worldWidth - 1, worldDepth - 1); // Dobro do tamanho
    geometry.rotateX(-Math.PI / 2);

    const vertices = geometry.attributes.position.array;
    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
        vertices[j + 1] = data[i] * 15; // Aumentado relevo
    }

    const texture = new THREE.CanvasTexture(generateTexture(data, worldWidth, worldDepth));
    texture.wrapS = THREE.RepeatWrapping; // Permite repetição da textura
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2); // Repete a textura 2x
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 0
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    return mesh;
}

// Função para criar a Terra
function createEarth() {
    const earthGeometry = new THREE.SphereGeometry(2000, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x2233ff,
        shininess: 25,
        transparent: true,
        opacity: 0.9
    });
    
    // Adiciona atmosfera à Terra
    const atmosphereGeometry = new THREE.SphereGeometry(2050, 64, 64);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x0033ff,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });

    // Adiciona nuvens
    const cloudGeometry = new THREE.SphereGeometry(2020, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    
    // Reposiciona a Terra para ficar mais visível
    earth.position.set(-8000, 3000, -10000);
    atmosphere.position.copy(earth.position);
    clouds.position.copy(earth.position);
    
    // Aumenta o brilho da Terra
    const earthLight = new THREE.PointLight(0x0044ff, 2, 5000);
    earthLight.position.copy(earth.position);
    
    scene.add(earth);
    scene.add(atmosphere);
    scene.add(clouds);
    scene.add(earthLight);
    
    return { earth, atmosphere, clouds, earthLight };
}

// Função para criar o Sol
function createSun() {
    const sunGeometry = new THREE.SphereGeometry(5000, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        transparent: true,
        opacity: 0.9
    });
    
    // Adiciona corona solar
    const coronaGeometry = new THREE.SphereGeometry(5200, 64, 64);
    const coronaMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    
    // Adiciona brilho
    const glowGeometry = new THREE.SphereGeometry(5500, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff5500,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });

    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    
    // Posiciona o Sol
    sun.position.set(30000, 10000, -40000);
    corona.position.copy(sun.position);
    glow.position.copy(sun.position);
    
    // Adiciona luz do Sol
    const sunLight = new THREE.PointLight(0xffffff, 2, 100000);
    sunLight.position.copy(sun.position);
    
    scene.add(sun);
    scene.add(corona);
    scene.add(glow);
    scene.add(sunLight);
    
    return { sun, corona, glow, sunLight };
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    try {
        controls.update(delta);

        // Update spaceship position and rotation
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        
        if (spaceship) {
            // Posição base da nave
            const nextPosition = camera.position.clone();
            nextPosition.x += cameraDirection.x * 600;
            nextPosition.z += cameraDirection.z * 600;
            nextPosition.y = camera.position.y - 200;
            
            // Obtém altura do terreno com offset para verificação antecipada
            const terrainHeight = getTerrainHeight(nextPosition);
            const minSafeHeight = terrainHeight + minHeight;
            
            // Verifica colisões antes de mover
            const collision = checkTerrainCollision(nextPosition, cameraDirection);
            
            // Limites do terreno lunar (metade do tamanho do terreno)
            const terrainLimit = 7500;
            
            // Verifica se a próxima posição está dentro dos limites do terreno
            if (Math.abs(nextPosition.x) > terrainLimit || Math.abs(nextPosition.z) > terrainLimit) {
                // Se estiver fora dos limites, mantém a posição anterior
                nextPosition.x = spaceship.position.x;
                nextPosition.z = spaceship.position.z;
            }
            
            // Ajusta altura baseado no terreno e colisões
            if (collision.ground || nextPosition.y < minSafeHeight) {
                nextPosition.y = minSafeHeight + 200; // Mantém distância segura do solo
            }

            if (collision.front) {
                nextPosition.y += 200; // Aumenta altura significativamente se houver obstáculo
            }

            // Atualiza posição com suavização
            spaceship.position.lerp(nextPosition, 0.08);

            // Rotação da nave
            const targetRotation = new THREE.Euler();
            targetRotation.y = Math.atan2(cameraDirection.x, cameraDirection.z);
            
            // Mantém a nave mais reta
            const pitchAngle = -cameraDirection.y * 0.05;
            
            // Aplica rotação suavemente
            spaceship.rotation.x = pitchAngle;
            spaceship.rotation.y = targetRotation.y;
            spaceship.rotation.z = -controls.moveRight * 0.01;

            // Limita a câmera dentro dos limites do terreno
            if (Math.abs(camera.position.x) > terrainLimit || Math.abs(camera.position.z) > terrainLimit) {
                // Se a câmera estiver fora dos limites, move de volta para dentro
                if (Math.abs(camera.position.x) > terrainLimit) {
                    camera.position.x = Math.sign(camera.position.x) * terrainLimit;
                }
                if (Math.abs(camera.position.z) > terrainLimit) {
                    camera.position.z = Math.sign(camera.position.z) * terrainLimit;
                }
            }

            // Impede que a câmera fique muito baixa
            const cameraMinHeight = getTerrainHeight(camera.position) + minHeight + 400;
            if (camera.position.y < cameraMinHeight) {
                camera.position.y = cameraMinHeight;
            }
        }

        renderer.render(scene, camera);
    } catch (error) {
        console.error("Error in animation loop:", error);
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
});

// Instructions
const instructions = document.createElement('div');
instructions.style.position = 'fixed';
instructions.style.top = '10px';
instructions.style.left = '10px';
instructions.style.color = 'white';
instructions.style.backgroundColor = 'rgba(0,0,0,0.5)';
instructions.style.padding = '10px';
instructions.style.borderRadius = '5px';
instructions.style.fontFamily = 'Arial';
instructions.innerHTML = `
    Controles:<br>
    Click Esquerdo/W - Mover para frente<br>
    Click Direito/S - Mover para trás<br>
    A - Mover para esquerda<br>
    D - Mover para direita<br>
    Mouse - Olhar ao redor
`;
document.body.appendChild(instructions);

// Start the scene
init(); 