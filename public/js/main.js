import * as THREE from 'three';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

// Configurações globais
const STREAM_WIDTH = 800;
const STREAM_HEIGHT = 450;
let streamScreen;
let cssRenderer;

// Scene setup
const scene = new THREE.Scene();
const cssScene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);

// Configurar WebGL renderer primeiro
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: false, // Mudado para false para garantir fundo preto
    powerPreference: "high-performance"
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '1';
document.body.appendChild(renderer.domElement);

// Configurar CSS3D Renderer depois
cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.left = '0';
cssRenderer.domElement.style.pointerEvents = 'none';
cssRenderer.domElement.style.zIndex = '2';
document.body.appendChild(cssRenderer.domElement);

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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
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
controls.enabled = false; // Desabilita os controles padrão

// Adiciona variáveis para controle de movimento
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
let sprint = false;

// Event listeners para controle de movimento
window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Space': moveUp = true; break;
        case 'ShiftLeft': sprint = true; break;
        case 'ControlLeft': moveDown = true; break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
        case 'Space': moveUp = false; break;
        case 'ShiftLeft': sprint = false; break;
        case 'ControlLeft': moveDown = false; break;
    }
});

// Mouse movement control
let mouseX = 0;
let mouseY = 0;
let targetRotationY = 0;
let verticalSpeed = 0;
const maxVerticalSpeed = 2000;
const verticalDamping = 0.95;

window.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === renderer.domElement) {
        mouseX = event.movementX * 0.002;
        mouseY = event.movementY * 10;
        
        targetRotationY -= mouseX;
        
        // Ajusta a velocidade vertical baseada no movimento do mouse
        verticalSpeed = Math.max(-maxVerticalSpeed, Math.min(maxVerticalSpeed, verticalSpeed - mouseY));
    }
});

// Pointer lock control
renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

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
        opacity: 0.2,
        shininess: 100,
        specular: 0xffffff,
        envMap: null,
        refractionRatio: 0.98,
        blending: THREE.AdditiveBlending // Adiciona blending para efeito de vidro
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

    group.scale.set(6, 6, 6);
    group.rotation.y = Math.PI; // Rotaciona a nave 180 graus para os propulsores ficarem para trás
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
    context.fillStyle = '#8B4513'; // Cor base marrom
    context.fillRect(0, 0, width, height);

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const imageData = image.data;

    for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
        vector3.x = data[j - 2] - data[j + 2];
        vector3.y = 2;
        vector3.z = data[j - width * 2] - data[j + width * 2];
        vector3.normalize();

        const shade = vector3.dot(sun);

        // Cores do terreno lunar (tons de marrom)
        imageData[i] = (139 + shade * 128) * (0.5 + data[j] * 0.007);     // R - mais vermelho
        imageData[i + 1] = (69 + shade * 128) * (0.5 + data[j] * 0.007);  // G - menos verde
        imageData[i + 2] = (19 + shade * 128) * (0.5 + data[j] * 0.007);  // B - menos azul
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
        // Limpa as cenas
        while(scene.children.length > 0) { 
            scene.remove(scene.children[0]); 
        }
        while(cssScene.children.length > 0) {
            cssScene.remove(cssScene.children[0]);
        }

        // Adiciona luzes básicas primeiro
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Cria elementos na ordem correta
        createStars();
        lunarTerrain = createLunarTerrain();
        spaceship = createSpaceship();
        createStreamScreen();
        const earth = createEarth();
        const sun = createSun();
        
        // Posiciona a nave acima do terreno lunar
        spaceship.position.set(0, 800, 0);
        spaceship.rotation.y = Math.PI; // Garante que a nave comece virada para trás
        
        // Posiciona a câmera atrás da nave
        camera.position.set(0, 1000, 1200);
        camera.lookAt(spaceship.position);
        
        // Configura os controles
        controls.lookSpeed = 0.1;
        controls.movementSpeed = 400;
        
        // Inicia o loop de animação
        animate();
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
        return intersects[0].point.y + 400; // Aumentado a altura mínima
    }
    return 400; // Altura padrão se não houver interseção
}

function checkTerrainCollision(position, direction) {
    // Verifica colisão frontal
    forwardRaycaster.set(position, direction);
    const frontIntersects = forwardRaycaster.intersectObject(lunarTerrain);
    
    // Verifica colisão com o solo
    raycaster.set(position, downVector);
    const downIntersects = raycaster.intersectObject(lunarTerrain);
    
    return {
        front: frontIntersects.length > 0 && frontIntersects[0].distance < 300,
        ground: downIntersects.length > 0 && downIntersects[0].distance < 400
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

// Função para criar a tela de stream
function createStreamScreen() {
    // Criar elemento DOM para o stream (frente)
    const streamElement = document.createElement('div');
    streamElement.style.width = STREAM_WIDTH + 'px';
    streamElement.style.height = STREAM_HEIGHT + 'px';
    streamElement.style.backgroundColor = '#000000';
    streamElement.style.border = '20px solid #ff6600';
    streamElement.style.borderRadius = '15px';
    streamElement.style.overflow = 'hidden';
    streamElement.style.pointerEvents = 'auto';
    
    // Criar elemento DOM para o stream (verso - clone do primeiro)
    const streamElementBack = streamElement.cloneNode(true);
    
    // Título da stream (frente)
    const titleElement = document.createElement('div');
    titleElement.textContent = '🔴 LIVE STREAM 🔴';
    titleElement.style.backgroundColor = '#ff0000';
    titleElement.style.color = 'white';
    titleElement.style.padding = '15px';
    titleElement.style.fontSize = '24px';
    titleElement.style.fontWeight = 'bold';
    titleElement.style.textAlign = 'center';
    titleElement.style.animation = 'blink 1s infinite';
    streamElement.appendChild(titleElement);
    
    // Título da stream (verso)
    const titleElementBack = titleElement.cloneNode(true);
    streamElementBack.appendChild(titleElementBack);
    
    // Iframe do stream (frente)
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = (STREAM_HEIGHT - 54) + 'px';
    iframe.style.border = 'none';
    iframe.src = 'https://203779.bitmap.stream/embed/video';
    iframe.allowFullscreen = true;
    streamElement.appendChild(iframe);
    
    // Iframe do stream (verso)
    const iframeBack = iframe.cloneNode(true);
    streamElementBack.appendChild(iframeBack);
    
    // Criar grupo para conter os dois lados do stream
    const streamGroup = new THREE.Group();
    
    // Criar objeto CSS3D para frente
    const streamObject = new CSS3DObject(streamElement);
    streamObject.position.set(2000, 1500, -2000);
    streamObject.scale.set(3, 3, 3);
    
    // Criar objeto CSS3D para verso (igual à frente)
    const streamObjectBack = new CSS3DObject(streamElementBack);
    streamObjectBack.position.set(2000, 1500, -2001); // Posição ligeiramente atrás
    streamObjectBack.scale.set(3, 3, 3);
    streamObjectBack.rotation.y = Math.PI; // Rotaciona 180 graus
    
    // Adiciona os dois lados ao grupo
    streamGroup.add(streamObject);
    streamGroup.add(streamObjectBack);
    
    cssScene.add(streamGroup);
    streamScreen = streamGroup;
    
    // Ajusta as luzes para a nova posição
    const spotLight1 = new THREE.SpotLight(0xff6600, 2);
    spotLight1.position.set(1600, 1600, -1900); // Ajustada altura da luz
    spotLight1.target.position.copy(streamObject.position);
    scene.add(spotLight1);
    scene.add(spotLight1.target);
    
    const spotLight2 = new THREE.SpotLight(0xff6600, 2);
    spotLight2.position.set(2400, 1600, -1900); // Ajustada altura da luz
    spotLight2.target.position.copy(streamObject.position);
    scene.add(spotLight2);
    scene.add(spotLight2.target);
    
    // Ajusta o halo para o novo tamanho
    const haloGeometry = new THREE.PlaneGeometry(STREAM_WIDTH * 3.3, STREAM_HEIGHT * 3.3);
    const haloMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    
    // Cria halos para ambos os lados
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    const haloBack = new THREE.Mesh(haloGeometry, haloMaterial.clone());
    
    halo.position.copy(streamObject.position);
    halo.position.z += 1;
    haloBack.position.copy(streamObjectBack.position);
    haloBack.position.z -= 1;
    haloBack.rotation.y = Math.PI;
    haloBack.scale.x = -1; // Espelha o halo traseiro também
    
    scene.add(halo);
    scene.add(haloBack);
    
    // Adiciona colisão para o stream
    const streamCollider = new THREE.Box3().setFromObject(streamGroup);
    
    // Animar os halos
    function animateHalo() {
        requestAnimationFrame(animateHalo);
        const opacity = 0.3 + Math.sin(Date.now() * 0.003) * 0.2;
        halo.material.opacity = opacity;
        haloBack.material.opacity = opacity;
    }
    animateHalo();
    
    return { streamGroup, streamCollider };
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    try {
        const delta = clock.getDelta();
        
        // Atualiza a nave se existir
        if (spaceship) {
            // Calcula a velocidade base e velocidade com sprint
            const baseSpeed = 6400;
            const currentSpeed = sprint ? baseSpeed * 2 : baseSpeed;
            
            // Calcula o movimento da nave
            const movement = new THREE.Vector3(0, 0, 0);
            
            // Direção para frente/trás
            if (moveForward) {
                movement.z = -currentSpeed * delta;
            }
            if (moveBackward) {
                movement.z = currentSpeed * delta;
            }
            
            // Direção para os lados
            if (moveLeft) {
                movement.x = -currentSpeed * delta;
            }
            if (moveRight) {
                movement.x = currentSpeed * delta;
            }
            
            // Movimento vertical
            if (moveUp) {
                movement.y = currentSpeed * delta;
            }
            if (moveDown) {
                movement.y = -currentSpeed * delta;
            }
            
            // Aplica o movimento vertical baseado no mouse
            movement.y += verticalSpeed * delta;
            
            // Aplica amortecimento na velocidade vertical
            verticalSpeed *= verticalDamping;
            
            // Aplica a rotação ao movimento
            movement.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotationY);
            
            // Atualiza a posição da nave
            const nextPosition = spaceship.position.clone().add(movement);
            
            // Verifica limites do terreno
            const terrainLimit = 7000;
            nextPosition.x = Math.max(-terrainLimit, Math.min(terrainLimit, nextPosition.x));
            nextPosition.z = Math.max(-terrainLimit, Math.min(terrainLimit, nextPosition.z));
            
            // Mantém uma altura mínima acima do terreno
            const terrainHeight = getTerrainHeight(nextPosition);
            nextPosition.y = Math.max(terrainHeight + 200, nextPosition.y);
            
            // Verifica colisão com o stream
            const streamBox = new THREE.Box3().setFromObject(streamScreen);
            const spaceshipBox = new THREE.Box3().setFromObject(spaceship);
            
            if (!streamBox.intersectsBox(spaceshipBox)) {
                // Atualiza posição da nave com suavização
                spaceship.position.lerp(nextPosition, 0.1);
            }
            
            // Atualiza rotação da nave
            spaceship.rotation.y = targetRotationY + Math.PI; // Adiciona PI para manter os propulsores para trás
            
            // Posiciona a câmera atrás da nave
            const cameraOffset = new THREE.Vector3(0, 200, 1200);
            cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotationY);
            
            const desiredCameraPosition = spaceship.position.clone().add(cameraOffset);
            camera.position.lerp(desiredCameraPosition, 0.1);
            
            // Faz a câmera olhar para a nave
            const lookAtPosition = spaceship.position.clone();
            lookAtPosition.y += 50;
            camera.lookAt(lookAtPosition);
            
            // Garante que a nave sempre fique visível
            spaceship.traverse((child) => {
                if (child.isMesh) {
                    child.renderOrder = 1; // Força a nave a ser renderizada por último
                    child.material.depthTest = true;
                    child.material.depthWrite = true;
                    child.material.transparent = true;
                    child.material.opacity = 1;
                }
            });
        }

        // Renderiza as cenas
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
        if (cssRenderer && cssScene && camera) {
            cssRenderer.render(cssScene, camera);
        }

    } catch (error) {
        console.error("Error in animation loop:", error);
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    
    if (controls) {
        controls.handleResize();
    }
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
    W - Mover para frente<br>
    S - Mover para trás<br>
    A - Mover para esquerda<br>
    D - Mover para direita<br>
    Espaço - Subir<br>
    Control - Descer<br>
    Shift - Correr (2x velocidade)<br>
    Mouse - Olhar ao redor<br>
    Click - Ativar controle do mouse
`;
document.body.appendChild(instructions);

// Start the scene
init(); 