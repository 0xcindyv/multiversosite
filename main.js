import * as THREE from 'three';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Configuração de eventos para o Multiverso Pass
document.addEventListener('DOMContentLoaded', function() {
    // Adiciona listeners para os eventos de acesso
    document.addEventListener('accessGranted', function(event) {
        console.log('Evento accessGranted recebido:', event.detail);
        window.hasMultiversoPass = true;
        window.hasAccess = true;
        console.log('Multiverso Pass ativado! hasMultiversoPass =', window.hasMultiversoPass);
        
        // Atualiza o acesso exclusivo
        if (typeof updateExclusiveAccess === 'function') {
            updateExclusiveAccess(true);
        } else {
            console.log('Função updateExclusiveAccess ainda não definida, acesso será atualizado posteriormente');
        }
    });
    
    document.addEventListener('accessDenied', function(event) {
        console.log('Evento accessDenied recebido:', event.detail);
        window.hasMultiversoPass = false;
        window.hasAccess = false;
        console.log('Multiverso Pass desativado! hasMultiversoPass =', window.hasMultiversoPass);
        
        // Atualiza o acesso exclusivo
        if (typeof updateExclusiveAccess === 'function') {
            updateExclusiveAccess(false);
            
            // Forçar a nave a retornar à área segura quando o acesso é revogado
            if (spaceship) {
                // Verificar se a nave está na área restrita
                const isInRestrictedArea = spaceship.position.z < -7000;
                
                if (isInRestrictedArea) {
                    console.log('Nave na área restrita. Retornando para área segura...');
                    // Teleportar a nave de volta para a área segura
                    spaceship.position.set(0, 800, -6000);
                    
                    // Mostrar mensagem de aviso
                    const statusMsg = document.createElement('div');
                    statusMsg.style.position = 'fixed';
                    statusMsg.style.top = '50%';
                    statusMsg.style.left = '50%';
                    statusMsg.style.transform = 'translate(-50%, -50%)';
                    statusMsg.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                    statusMsg.style.color = '#ff0000';
                    statusMsg.style.padding = '20px';
                    statusMsg.style.borderRadius = '10px';
                    statusMsg.style.fontFamily = 'Arial';
                    statusMsg.style.fontSize = '24px';
                    statusMsg.style.zIndex = '1000';
                    statusMsg.innerHTML = '⚠️ Acesso revogado! Você foi teleportado para a área segura.';
                    document.body.appendChild(statusMsg);
                    
                    // Remove a mensagem após 5 segundos
                    setTimeout(() => {
                        document.body.removeChild(statusMsg);
                    }, 5000);
                }
            }
        } else {
            console.log('Função updateExclusiveAccess ainda não definida, acesso será atualizado posteriormente');
        }
    });
});

// Adicionar evento de clique global para o botão Mint
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(event) {
        const mintButton = document.getElementById('mint-multiverso-pass-button');
        if (mintButton && (event.target === mintButton || mintButton.contains(event.target))) {
            console.log('Clique no botão Mint detectado via documento!');
            window.open('https://inscribenow.io/collections/38ad28c5d73e92ec', '_blank');
            event.preventDefault();
            event.stopPropagation();
        }
    }, true); // Usar captura para garantir que o evento seja processado antes
});

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
renderer.domElement.id = 'webgl-renderer'; // Adicionar ID para facilitar depuração
// Importante: garantir que o renderer não bloqueie eventos de clique em elementos da UI
renderer.domElement.style.pointerEvents = 'auto'; // Permitir eventos apenas em objetos 3D
document.body.appendChild(renderer.domElement);

// Configurar CSS3D Renderer depois
cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.left = '0';
cssRenderer.domElement.style.pointerEvents = 'none';
cssRenderer.domElement.style.zIndex = '2';
cssRenderer.domElement.id = 'css-renderer';
document.body.appendChild(cssRenderer.domElement);

// Add orange glow to background
const orangeLight = new THREE.PointLight(0xff6600, 2, 3000);
orangeLight.position.set(0, -500, -1000);
scene.add(orangeLight);

const orangeAmbient = new THREE.AmbientLight(0xff6600, 0.2);
scene.add(orangeAmbient);

// Configurar raycaster para interação com objetos 3D
const uiRaycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Função para lidar com cliques em objetos 3D
function onDocumentMouseDown(event) {
    // Calcular posição do mouse normalizada
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    // Atualizar o raycaster
    uiRaycaster.setFromCamera(mouse, camera);
    
    // Verificar interseções com objetos na cena
    const intersects = uiRaycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        console.log('Clique em objeto 3D:', intersects[0].object);
        // Aqui você pode adicionar lógica para interagir com objetos 3D
        
        // Impedir que o clique se propague para elementos da UI
        event.stopPropagation();
    }
}

// Adicionar evento de clique apenas para objetos 3D
renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);

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

// Configuração inicial dos controles
const controls = new FirstPersonControls(camera, renderer.domElement);
controls.movementSpeed = 25; // Velocidade de movimento
controls.lookSpeed = 0.02; // Reduzido de 0.1 para 0.02 para movimento mais suave
controls.constrainVertical = true; // Restringe movimento vertical
controls.verticalMin = Math.PI / 4; // Limite mínimo de rotação vertical
controls.verticalMax = Math.PI / 1.5; // Limite máximo de rotação vertical
controls.activeLook = true;
controls.mouseDragOn = false;

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
        // Tecla M para verificar o status do Multiverso Pass (para depuração)
        case 'KeyM': 
            const status = checkMultiversoPassStatus();
            console.log('Status do Multiverso Pass (tecla M):', status);
            console.log('window.hasMultiversoPass =', window.hasMultiversoPass);
            console.log('window.hasAccess =', window.hasAccess);
            
            // Mostra uma mensagem na tela
            const statusMsg = document.createElement('div');
            statusMsg.style.position = 'fixed';
            statusMsg.style.top = '50%';
            statusMsg.style.left = '50%';
            statusMsg.style.transform = 'translate(-50%, -50%)';
            statusMsg.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            statusMsg.style.color = status ? '#00ff00' : '#ff0000';
            statusMsg.style.padding = '20px';
            statusMsg.style.borderRadius = '10px';
            statusMsg.style.fontFamily = 'Arial';
            statusMsg.style.fontSize = '24px';
            statusMsg.style.zIndex = '1000';
            statusMsg.innerHTML = status ? 
                '✅ Multiverso Pass Ativo - Sem restrições laterais' : 
                '❌ Multiverso Pass Inativo - Com restrições laterais';
            
            // Adiciona informações sobre a posição atual da nave
            if (spaceship) {
                statusMsg.innerHTML += `<br><br>Posição atual: X: ${Math.round(spaceship.position.x)}, Z: ${Math.round(spaceship.position.z)}`;
                
                // Verifica se a nave está na área restrita
                const terrainLimit = 7000;
                const isInRestrictedArea = spaceship.position.z < -terrainLimit;
                
                if (isInRestrictedArea) {
                    statusMsg.innerHTML += '<br><br>⚠️ Você está na área além do portal!';
                    
                    if (!status) {
                        statusMsg.innerHTML += '<br>Sem Multiverso Pass, você será teleportado para a área segura.';
                    } else {
                        statusMsg.innerHTML += '<br>Com Multiverso Pass, você tem acesso livre a esta área.';
                    }
                } else {
                    statusMsg.innerHTML += '<br><br>Você está na área principal do terreno lunar.';
                }
            }
            
            document.body.appendChild(statusMsg);
            
            // Força uma atualização do acesso exclusivo
            updateExclusiveAccess(status);
            
            // Remove a mensagem após 3 segundos
            setTimeout(() => {
                document.body.removeChild(statusMsg);
            }, 3000);
            break;
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
renderer.domElement.addEventListener('click', (event) => {
    // Verificar se o clique foi no botão Mint ou em seus elementos filhos
    const mintButton = document.getElementById('mint-multiverso-pass-button');
    
    // Se o clique foi no botão ou em qualquer elemento dentro dele, não fazer nada
    if (mintButton && (event.target === mintButton || mintButton.contains(event.target) || event.target.closest('#mint-multiverso-pass-button'))) {
        console.log('Clique no botão Mint detectado via renderer! Ignorando pointer lock.');
        event.preventDefault();
        event.stopPropagation();
        return; // Não solicitar pointer lock se o clique foi no botão
    }
    
    // Se não foi no botão, solicitar pointer lock
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
    
    // Aumenta quantidade de estrelas e distribui em um volume maior
    for (let i = 0; i < 50000; i++) {
        const x = THREE.MathUtils.randFloatSpread(20000);
        const y = THREE.MathUtils.randFloatSpread(20000);
        const z = THREE.MathUtils.randFloatSpread(20000);
        vertices.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    // Cria múltiplas camadas de estrelas com diferentes características
    const tinyStars = new THREE.Points(
        geometry.clone(),
        new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 1.2,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        })
    );
    
    const smallStars = new THREE.Points(
        geometry.clone(),
        new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 2.0,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        })
    );
    
    const mediumStars = new THREE.Points(
        geometry.clone(),
        new THREE.PointsMaterial({
            color: 0xFFFAF0,
            size: 2.8,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        })
    );
    
    const largeStars = new THREE.Points(
        geometry.clone(),
        new THREE.PointsMaterial({
            color: 0xFFEFD5,
            size: 3.5,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        })
    );
    
    const glowingStars = new THREE.Points(
        geometry.clone(),
        new THREE.PointsMaterial({
            color: 0xE6E6FA,
            size: 4.2,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        })
    );

    // Adiciona camadas extras de estrelas em diferentes posições
    const extraStars1 = tinyStars.clone();
    extraStars1.position.set(8000, -8000, -8000);
    
    const extraStars2 = smallStars.clone();
    extraStars2.position.set(-8000, 8000, -8000);
    
    // Adiciona mais camadas de estrelas especialmente para a área exclusiva
    const exclusiveStars1 = mediumStars.clone();
    exclusiveStars1.position.set(0, 5000, -15000);
    
    const exclusiveStars2 = glowingStars.clone();
    exclusiveStars2.position.set(0, 3000, -12000);

    scene.add(tinyStars);
    scene.add(smallStars);
    scene.add(mediumStars);
    scene.add(largeStars);
    scene.add(glowingStars);
    scene.add(extraStars1);
    scene.add(extraStars2);
    scene.add(exclusiveStars1);
    scene.add(exclusiveStars2);
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
    context.fillStyle = '#4A4A4A'; // Cor base cinza escuro
    context.fillRect(0, 0, width, height);

    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const imageData = image.data;

    for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
        vector3.x = data[j - 2] - data[j + 2];
        vector3.y = 2;
        vector3.z = data[j - width * 2] - data[j + width * 2];
        vector3.normalize();

        const shade = vector3.dot(sun);

        // Cores do terreno lunar (tons de cinza-marrom)
        imageData[i] = (74 + shade * 80) * (0.5 + data[j] * 0.007);     // R - reduzido
        imageData[i + 1] = (69 + shade * 70) * (0.5 + data[j] * 0.007);  // G - reduzido
        imageData[i + 2] = (65 + shade * 60) * (0.5 + data[j] * 0.007);  // B - reduzido
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

// Create exclusive lunar terrain beyond the portal
function createExclusiveLunarTerrain() {
    const worldWidth = 256;
    const worldDepth = 256;
    
    const data = generateHeight(worldWidth, worldDepth);
    
    const geometry = new THREE.PlaneGeometry(15000, 15000, worldWidth - 1, worldDepth - 1);
    geometry.rotateX(-Math.PI / 2);

    const vertices = geometry.attributes.position.array;
    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
        vertices[j + 1] = data[i] * 15;
    }

    // Função modificada para gerar textura com tonalidade mais avermelhada
    function generateExclusiveTexture(data, width, height) {
        const vector3 = new THREE.Vector3(0, 0, 0);
        const sun = new THREE.Vector3(1, 1, 1);
        sun.normalize();

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        context.fillStyle = '#5A4A40'; // Cor base marrom-acinzentado
        context.fillRect(0, 0, width, height);

        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const imageData = image.data;

        for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
            vector3.x = data[j - 2] - data[j + 2];
            vector3.y = 2;
            vector3.z = data[j - width * 2] - data[j + width * 2];
            vector3.normalize();

            const shade = vector3.dot(sun);

            // Cores do terreno exclusivo (tons mais marrom-acinzentados)
            imageData[i] = (90 + shade * 80) * (0.5 + data[j] * 0.007);     // R - reduzido
            imageData[i + 1] = (74 + shade * 70) * (0.5 + data[j] * 0.007);  // G - reduzido
            imageData[i + 2] = (64 + shade * 60) * (0.5 + data[j] * 0.007);  // B - reduzido
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

    const texture = new THREE.CanvasTexture(generateExclusiveTexture(data, worldWidth, worldDepth));
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 0
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Posiciona o terreno exclusivo exatamente na borda do terreno normal
    // O terreno normal tem 15000 de tamanho e está centralizado em (0,0,0)
    // Então a borda do terreno normal está em z = -7500
    // Posicionamos o terreno exclusivo com sua borda em z = -7500
    const terrainLimit = 7000; // Limite de colisão
    mesh.position.set(0, 0, -terrainLimit - 7500); // Posiciona para que a borda fique exatamente no limite
    
    // Adiciona luzes especiais no terreno exclusivo
    const exclusiveLight1 = new THREE.PointLight(0xff3300, 1, 5000);
    exclusiveLight1.position.set(2000, 1000, -terrainLimit - 10000);
    scene.add(exclusiveLight1);
    
    const exclusiveLight2 = new THREE.PointLight(0xff5500, 1, 5000);
    exclusiveLight2.position.set(-2000, 1000, -terrainLimit - 10000);
    scene.add(exclusiveLight2);
    
    // Adiciona um leve brilho vermelho ao terreno exclusivo
    const exclusiveAmbient = new THREE.AmbientLight(0xff2200, 0.2);
    exclusiveAmbient.position.set(0, 0, -terrainLimit - 10000);
    scene.add(exclusiveAmbient);
    
    scene.add(mesh);
    return mesh;
}

// Initialize scene
let spaceship;
let lunarTerrain;
let exclusiveLunarTerrain; // Nova referência para o terreno exclusivo
let mysticalPortal;
let portalMessageElement;
let exclusiveVideoPlayer; // Nova referência para o player de vídeo exclusivo para hodlers

// Adicionar variável global para o botão
let mintButton;

function init() {
    try {
        // Limpa as cenas
        while(scene.children.length > 0) { 
            scene.remove(scene.children[0]); 
        }
        while(cssScene.children.length > 0) {
            cssScene.remove(cssScene.children[0]);
        }

        // Remove TODOS os elementos UI antigos e botões
        document.querySelectorAll('[class*="restricted"], [class*="portal"], .area-button, #restricted-area, .exclusive-video-container, .exclusive-video-player, #reopen-exclusive-video').forEach(el => el.remove());

        // Adiciona luzes básicas primeiro
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Cria elementos na ordem correta
        createStars();
        lunarTerrain = createLunarTerrain();
        exclusiveLunarTerrain = createExclusiveLunarTerrain();
        
        // Verifica o status do Multiverso Pass antes de definir a visibilidade
        const hasPass = window.hasMultiversoPass === true || window.hasAccess === true;
        console.log('Inicializando terreno exclusivo. Status do Multiverso Pass:', hasPass);
        console.log('window.hasMultiversoPass =', window.hasMultiversoPass);
        console.log('window.hasAccess =', window.hasAccess);
        exclusiveLunarTerrain.visible = hasPass;
        
        spaceship = createSpaceship();
        createStreamScreen();
        const earth = createEarth();
        const sun = createSun();
        mysticalPortal = createMysticalPortal();
        createPortalMessage();
        mintButton = createMintButton(); // Armazenar o botão em uma variável global
        
        // IMPORTANTE: Sempre criar o player de vídeo exclusivo, independente do acesso
        // Isso garante que ele exista e possa ser mostrado quando o acesso for concedido
        console.log('🔵 INIT: Criando player de vídeo exclusivo...');
        exclusiveVideoPlayer = createExclusiveVideoPlayer();
        
        // Definir visibilidade com base no acesso
        if (exclusiveVideoPlayer && exclusiveVideoPlayer.videoGroup) {
            exclusiveVideoPlayer.videoGroup.visible = hasPass;
            console.log('🔵 INIT: Player exclusivo criado e definido como:', hasPass ? 'VISÍVEL' : 'INVISÍVEL');
            
            // Atualizar visibilidade dos elementos visuais auxiliares
            if (exclusiveVideoPlayer.marker) exclusiveVideoPlayer.marker.visible = hasPass;
            if (exclusiveVideoPlayer.particles) exclusiveVideoPlayer.particles.visible = hasPass;
            if (exclusiveVideoPlayer.halo) exclusiveVideoPlayer.halo.visible = hasPass;
            if (exclusiveVideoPlayer.plane) exclusiveVideoPlayer.plane.visible = hasPass;
            if (exclusiveVideoPlayer.ambientLight) exclusiveVideoPlayer.ambientLight.visible = hasPass;
            
            // Forçar renderização imediata para garantir que o player seja exibido
            if (cssRenderer && cssScene && camera) {
                cssRenderer.render(cssScene, camera);
                console.log('🔵 INIT: Forçando renderização CSS3D inicial');
            }
        }
        
        // Posiciona a nave acima do terreno lunar
        spaceship.position.set(0, 800, 0);
        spaceship.rotation.y = Math.PI;
        
        // Posiciona a câmera atrás da nave
        camera.position.set(0, 1000, 1200);
        camera.lookAt(spaceship.position);
        
        // Configura os controles com velocidade muito reduzida
        controls.movementSpeed = 25; // Velocidade base de movimento
        controls.lookSpeed = 0.02; // Velocidade de rotação reduzida
        controls.autoForward = false; // Desativa movimento automático
        controls.dragToLook = true; // Requer arrastar para olhar
        
        // Define aceleração e desaceleração
        controls.acceleration = 5; // Reduz aceleração
        controls.deceleration = 5; // Aumenta desaceleração
        
        // Inicia o loop de animação
        animate();
        
        // Verifica acesso inicial
        // Importante: Usa a função updateExclusiveAccess para garantir consistência
        console.log('Verificando acesso inicial. Status do Multiverso Pass:', hasPass);
        updateExclusiveAccess(hasPass);
        
        // Adiciona evento para redimensionamento da janela
        window.addEventListener('resize', onWindowResize);
        
        console.log('🔵 Inicialização concluída com sucesso');
    } catch (error) {
        console.error('🔴 ERRO durante a inicialização:', error);
    }
}

// ... existing code ...

// Função para detectar altura do terreno
const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0);
const targetHeight = 300;
const minHeight = 200;
const smoothFactor = 0.1;
const forwardRaycaster = new THREE.Raycaster();

/**
 * Verifica a altura do terreno em uma determinada posição
 * @param {THREE.Vector3} position - Posição a ser verificada
 * @returns {number} Altura mínima segura acima do terreno
 */
function getTerrainHeight(position) {
    // Verifica a altura do terreno principal
    raycaster.set(position, downVector);
    const intersects = raycaster.intersectObject(lunarTerrain);
    
    // Verifica explicitamente o status do Multiverso Pass
    const hasMultiversoPass = window.hasMultiversoPass === true || window.hasAccess === true;
    
    // Se o usuário tem Multiverso Pass, verifica também o terreno exclusivo
    if (hasMultiversoPass && exclusiveLunarTerrain && exclusiveLunarTerrain.visible) {
        raycaster.set(position, downVector);
        const exclusiveIntersects = raycaster.intersectObject(exclusiveLunarTerrain);
        
        // Se houver interseção com o terreno exclusivo, usa a maior altura
        if (exclusiveIntersects.length > 0) {
            const exclusiveHeight = exclusiveIntersects[0].point.y + 400;
            const regularHeight = intersects.length > 0 ? intersects[0].point.y + 400 : 400;
            
            // Retorna a maior altura entre os dois terrenos
            return Math.max(exclusiveHeight, regularHeight);
        }
    }
    
    // Mantém a nave a uma altura segura acima do terreno
    return intersects.length > 0 ? intersects[0].point.y + 400 : 400;
}

/**
 * Sistema de colisão do terreno com duas regras:
 * 1. Com Multiverso Pass: Apenas impede atravessar o solo
 * 2. Sem Multiverso Pass: Impede atravessar o solo e limita área de movimento
 */
function checkTerrainCollision(nextPosition) {
    // Altura mínima do terreno (sempre aplicada)
    const minHeight = getTerrainHeight(nextPosition);
    
    // Verifica explicitamente o status do Multiverso Pass
    const hasMultiversoPass = window.hasMultiversoPass === true || window.hasAccess === true;
    
    // Com Multiverso Pass: Permite voar livremente, mantendo apenas altura mínima
    if (hasMultiversoPass) {
        // IMPORTANTE: Usuários com Multiverso Pass não têm NENHUMA restrição lateral
        // Apenas mantém a altura mínima acima do terreno para não atravessar o solo
        return {
            canMove: true,
            position: new THREE.Vector3(
                nextPosition.x,  // Sem restrições laterais
                Math.max(minHeight, nextPosition.y),  // Apenas mantém altura mínima
                nextPosition.z   // Sem restrições laterais
            )
        };
    }
    
    // Sem Multiverso Pass: Aplica limites laterais rigorosos em todas as direções
    const terrainLimit = 7000;
    const isOutsideBounds = 
        Math.abs(nextPosition.x) > terrainLimit || 
        Math.abs(nextPosition.z) > terrainLimit;
    
    if (isOutsideBounds) {
        // Bloqueia movimento além dos limites para usuários sem Multiverso Pass
        console.log('Movimento bloqueado: fora dos limites permitidos sem Multiverso Pass');
        return {
            canMove: false,
            position: new THREE.Vector3(
                Math.sign(nextPosition.x) * Math.min(Math.abs(nextPosition.x), terrainLimit),
                Math.max(minHeight, nextPosition.y),
                Math.sign(nextPosition.z) * Math.min(Math.abs(nextPosition.z), terrainLimit)
            )
        };
    }
    
    // Dentro dos limites permitidos, apenas mantém altura mínima
    return {
        canMove: true,
        position: new THREE.Vector3(
            nextPosition.x,
            Math.max(minHeight, nextPosition.y),
            nextPosition.z
        )
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
    const earthGeometry = new THREE.SphereGeometry(1600, 128, 128); // Dobro do tamanho anterior
    
    // Carrega texturas da Terra
    const textureLoader = new THREE.TextureLoader();
    
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: textureLoader.load('/textures/earth_daymap.jpg'),
        bumpMap: textureLoader.load('/textures/earth_bumpmap.jpg'),
        bumpScale: 10,
        specularMap: textureLoader.load('/textures/earth_specular.jpg'),
        specular: new THREE.Color(0x333333),
        shininess: 25,
        normalMap: textureLoader.load('/textures/earth_normal.jpg'),
        normalScale: new THREE.Vector2(6, 6)
    });
    
    // Adiciona atmosfera à Terra com efeito de glow
    const atmosphereGeometry = new THREE.SphereGeometry(1664, 128, 128); // Dobro do tamanho anterior
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x4ca6ff,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });

    // Adiciona nuvens com textura
    const cloudGeometry = new THREE.SphereGeometry(1624, 128, 128); // Dobro do tamanho anterior
    const cloudMaterial = new THREE.MeshPhongMaterial({
        map: textureLoader.load('/textures/earth_clouds.jpg'),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    
    // Reposiciona a Terra para ficar mais distante
    earth.position.set(4000, 4000, -8000); // Aumentada a altura (Y) de 2000 para 4000
    atmosphere.position.copy(earth.position);
    clouds.position.copy(earth.position);
    
    // Adiciona iluminação ambiente suave para a Terra
    const earthAmbient = new THREE.AmbientLight(0x222222);
    earthAmbient.position.copy(earth.position);
    
    // Adiciona luz direcional para simular luz solar
    const earthLight = new THREE.DirectionalLight(0xffffff, 1);
    earthLight.position.set(earth.position.x + 5000, earth.position.y, earth.position.z);
    
    // Grupo para manter todos os elementos da Terra juntos
    const earthGroup = new THREE.Group();
    earthGroup.add(earth);
    earthGroup.add(atmosphere);
    earthGroup.add(clouds);
    earthGroup.add(earthAmbient);
    earthGroup.add(earthLight);
    
    scene.add(earthGroup);
    
    // Adiciona animação de rotação completa
    earth.rotation.y = Math.PI;
    const animate = () => {
        earth.rotation.y += 0.0005; // Velocidade de rotação mais lenta
        clouds.rotation.y += 0.00055; // Nuvens girando um pouco mais rápido que a Terra
        requestAnimationFrame(animate);
    };
    animate();
    
    return { earthGroup, earth, atmosphere, clouds };
}

// Função para criar o Sol
function createSun() {
    // Carrega texturas para o Sol
    const textureLoader = new THREE.TextureLoader();
    
    // Cria textura de lensflare proceduralmente
    const lensflareTexture = createLensflareTexture();
    
    // Cria textura de partícula de poeira proceduralmente
    const dustParticleTexture = createDustParticleTexture();
    
    // Cria textura de superfície solar proceduralmente
    const sunSurfaceTexture = createSunSurfaceTexture();
    
    // Sol principal com textura e cor mais realista
    const sunGeometry = new THREE.SphereGeometry(1600, 128, 128);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffcc00, // Amarelo dourado mais vibrante
        emissive: 0xffcc00,
        emissiveIntensity: 1,
        transparent: false,
        opacity: 1,
        map: sunSurfaceTexture
    });
    
    // Adiciona corona solar mais brilhante
    const coronaGeometry = new THREE.SphereGeometry(1750, 128, 128);
    const coronaMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00, // Laranja dourado
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    
    // Adiciona brilho externo mais intenso
    const glowGeometry = new THREE.SphereGeometry(1900, 128, 128);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8800, // Laranja mais intenso
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    
    // Adiciona halo externo mais amplo
    const haloGeometry = new THREE.SphereGeometry(2200, 128, 128);
    const haloMaterial = new THREE.MeshBasicMaterial({
        color: 0xff5500, // Laranja avermelhado
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });

    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    
    // Posiciona o Sol na mesma altura da Terra e mais à esquerda
    sun.position.set(-8000, 4000, -8000);
    corona.position.copy(sun.position);
    glow.position.copy(sun.position);
    halo.position.copy(sun.position);
    
    // Adiciona luz principal do Sol mais intensa
    const sunLight = new THREE.PointLight(0xffcc00, 3, 50000);
    sunLight.position.copy(sun.position);
    sunLight.castShadow = true; // Permite que a luz projete sombras
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    
    // Adiciona luz ambiente mais quente
    const sunAmbient = new THREE.AmbientLight(0xffcc88, 0.3);
    
    // Cria raios de luz visíveis que saem do Sol
    const rayGroup = new THREE.Group();
    const rayCount = 12; // Aumentado para 12 raios
    const rayLength = 5000;
    
    for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const rayGeometry = new THREE.CylinderGeometry(100, 300, rayLength, 16, 1, true);
        const rayMaterial = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const ray = new THREE.Mesh(rayGeometry, rayMaterial);
        
        // Posiciona e orienta o raio
        ray.position.set(
            sun.position.x + Math.cos(angle) * rayLength/2,
            sun.position.y + Math.sin(angle) * rayLength/2,
            sun.position.z
        );
        ray.lookAt(sun.position);
        ray.rotateX(Math.PI/2);
        
        rayGroup.add(ray);
    }
    
    // Adiciona luzes direcionais para simular raios de luz em direções específicas
    const lightDirections = [
        new THREE.Vector3(1, -0.5, 1),    // Direção para o terreno principal
        new THREE.Vector3(0, -0.7, 1),     // Direção central
        new THREE.Vector3(-1, -0.5, 1),     // Direção para o terreno exclusivo
        new THREE.Vector3(0.5, -0.3, 0.5)  // Direção adicional para iluminação
    ];
    
    const directionalLights = [];
    
    for (let dir of lightDirections) {
        const dirLight = new THREE.DirectionalLight(0xffcc00, 1.5);
        dirLight.position.copy(sun.position);
        dirLight.target.position.set(
            sun.position.x + dir.x * 10000,
            sun.position.y + dir.y * 10000,
            sun.position.z + dir.z * 10000
        );
        dirLight.castShadow = true; // Permite que a luz projete sombras
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        
        directionalLights.push(dirLight);
        scene.add(dirLight);
        scene.add(dirLight.target);
    }
    
    // Adiciona efeito de lensflare (reflexo de lente)
    const lensflareSize = 700;
    const lensflareGeometry = new THREE.PlaneGeometry(lensflareSize, lensflareSize);
    const lensflareMaterial = new THREE.MeshBasicMaterial({
        map: lensflareTexture,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        side: THREE.DoubleSide
    });
    
    const lensflare = new THREE.Mesh(lensflareGeometry, lensflareMaterial);
    lensflare.position.copy(sun.position);
    lensflare.position.z += 100; // Ligeiramente à frente do sol
    scene.add(lensflare);
    
    // Grupo para manter todos os elementos do Sol juntos
    const sunGroup = new THREE.Group();
    sunGroup.add(sun);
    sunGroup.add(corona);
    sunGroup.add(glow);
    sunGroup.add(halo);
    sunGroup.add(rayGroup);
    
    scene.add(sunGroup);
    scene.add(sunLight);
    scene.add(sunAmbient);
    
    // Adiciona animação para os elementos do Sol
    function animateSun() {
        const time = Date.now() * 0.001;
        
        // Pulsa o brilho suavemente
        corona.material.opacity = 0.4 + Math.sin(time * 0.5) * 0.1;
        glow.material.opacity = 0.3 + Math.sin(time * 0.3) * 0.1;
        halo.material.opacity = 0.2 + Math.sin(time * 0.2) * 0.1;
        
        // Rotaciona os raios lentamente
        rayGroup.rotation.z += 0.001;
        
        // Rotaciona o sol lentamente
        sun.rotation.y += 0.0005;
        
        // Varia a intensidade das luzes
        sunLight.intensity = 3 + Math.sin(time * 0.5) * 0.5;
        
        for (let light of directionalLights) {
            light.intensity = 1.5 + Math.sin(time * 0.3 + Math.random()) * 0.3;
        }
        
        // Faz o lensflare sempre olhar para a câmera
        if (camera) {
            lensflare.lookAt(camera.position);
            
            // Ajusta a opacidade do lensflare baseado no ângulo entre a câmera e o sol
            const cameraToSun = new THREE.Vector3().subVectors(sun.position, camera.position).normalize();
            const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            const angleCos = cameraToSun.dot(cameraDirection);
            
            // Só mostra o lensflare quando o sol está no campo de visão
            lensflare.material.opacity = Math.max(0, angleCos) * 0.7;
        }
        
        requestAnimationFrame(animateSun);
    }
    animateSun();
    
    return { 
        sunGroup, 
        sunLight, 
        sunAmbient, 
        directionalLights, 
        lensflare
    };
}

// Função para criar textura de superfície solar proceduralmente
function createSunSurfaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Cor de fundo
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#ffcc00');
    gradient.addColorStop(0.5, '#ff8800');
    gradient.addColorStop(1, '#ff5500');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Adiciona ruído para simular a superfície turbulenta do sol
    const addNoise = (scale, intensity, color) => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4;
                
                // Simplex noise seria ideal, mas usaremos Math.random para simplicidade
                const noise = Math.sin(x / scale) * Math.cos(y / scale) * intensity;
                
                // Adiciona o ruído aos canais RGB
                data[index] = Math.min(255, Math.max(0, data[index] + noise * color.r));
                data[index + 1] = Math.min(255, Math.max(0, data[index + 1] + noise * color.g));
                data[index + 2] = Math.min(255, Math.max(0, data[index + 2] + noise * color.b));
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    };
    
    // Adiciona várias camadas de ruído com diferentes escalas
    addNoise(10, 30, { r: 255, g: 200, b: 100 });
    addNoise(20, 20, { r: 255, g: 150, b: 50 });
    addNoise(5, 10, { r: 255, g: 255, b: 200 });
    
    // Adiciona manchas solares
    const addSunspot = (x, y, radius) => {
        const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        spotGradient.addColorStop(0, 'rgba(100, 50, 0, 0.8)');
        spotGradient.addColorStop(0.7, 'rgba(150, 100, 0, 0.5)');
        spotGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
        
        ctx.fillStyle = spotGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    };
    
    // Adiciona algumas manchas solares aleatórias
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 10 + Math.random() * 40;
        addSunspot(x, y, radius);
    }
    
    // Adiciona erupções solares
    const addSolarFlare = (x, y, length, angle) => {
        const flareGradient = ctx.createLinearGradient(
            x, y,
            x + Math.cos(angle) * length,
            y + Math.sin(angle) * length
        );
        flareGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
        flareGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
        
        ctx.strokeStyle = flareGradient;
        ctx.lineWidth = 5 + Math.random() * 10;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        // Curva de Bezier para criar uma erupção mais natural
        const cp1x = x + Math.cos(angle + 0.2) * length * 0.3;
        const cp1y = y + Math.sin(angle + 0.2) * length * 0.3;
        const cp2x = x + Math.cos(angle - 0.2) * length * 0.6;
        const cp2y = y + Math.sin(angle - 0.2) * length * 0.6;
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        ctx.stroke();
    };
    
    // Adiciona algumas erupções solares aleatórias
    for (let i = 0; i < 8; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const length = 50 + Math.random() * 100;
        const angle = Math.random() * Math.PI * 2;
        addSolarFlare(x, y, length, angle);
    }
    
    // Cria textura a partir do canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    texture.needsUpdate = true;
    
    return texture;
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

// Função para criar o portal místico
function createMysticalPortal() {
    const portalGroup = new THREE.Group();
    
    // Anel externo do portal (1.5x menor que antes)
    const ringGeometry = new THREE.TorusGeometry(1600, 160, 32, 100); // Reduzido de 2400 para 1600
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0xFF0000, // Vermelho como a nave
        emissive: 0x00FF00, // Verde como a nave
        emissiveIntensity: 3,
        shininess: 100,
        transparent: true,
        opacity: 0.9
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    portalGroup.add(ring);
    
    // Efeito de energia dentro do portal (1.5x menor)
    const energyGeometry = new THREE.CircleGeometry(1440, 32); // Reduzido de 2160 para 1440
    const energyMaterial = new THREE.MeshPhongMaterial({
        color: 0x0000FF, // Azul como a nave
        emissive: 0x800080, // Roxo como a nave
        emissiveIntensity: 3,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    const energy = new THREE.Mesh(energyGeometry, energyMaterial);
    portalGroup.add(energy);
    
    // Partículas ao redor do portal (área aumentada)
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCnt = 5000; // Mais partículas para área maior
    const posArray = new Float32Array(particlesCnt * 3);
    
    for(let i = 0; i < particlesCnt * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 4267; // Reduzido de 6400 para 4267
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 20,
        color: 0x800080, // Roxo como a nave
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    portalGroup.add(particles);
    
    // Luzes do portal (mais intensas)
    const portalLight = new THREE.PointLight(0xFF0000, 10, 8000); // Vermelho como a nave
    portalLight.position.set(0, 0, 0);
    portalGroup.add(portalLight);
    
    const portalLight2 = new THREE.PointLight(0x00FF00, 8, 6000); // Verde como a nave
    portalLight2.position.set(0, 0, 0);
    portalGroup.add(portalLight2);

    // Marcador flutuante acima do portal (laranja como o stream)
    const markerGeometry = new THREE.ConeGeometry(213, 427, 4); // Reduzido de 320/640 para 213/427
    const markerMaterial = new THREE.MeshPhongMaterial({
        color: 0xff6600, // Laranja do stream
        emissive: 0xff6600, // Laranja do stream
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0.9
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.y = 2133; // Reduzido de 3200 para 2133
    portalGroup.add(marker);
    
    // Posiciona o portal na junção dos dois terrenos lunares
    const terrainLimit = 7000;
    portalGroup.position.set(0, 1600, -terrainLimit); // Exatamente no limite de colisão
    
    // Adiciona animação melhorada
    function animatePortal() {
        ring.rotation.z += 0.005;
        particles.rotation.y += 0.001;
        energy.material.opacity = 0.5 + Math.sin(Date.now() * 0.001) * 0.3;
        
        // Anima o marcador
        marker.position.y = 2133 + Math.sin(Date.now() * 0.002) * 267; // Reduzido de 3200/400 para 2133/267
        marker.rotation.y += 0.02; // Rotação constante
        
        // Pulsa as luzes com mais intensidade
        portalLight.intensity = 10 + Math.sin(Date.now() * 0.002) * 5;
        portalLight2.intensity = 8 + Math.sin(Date.now() * 0.003) * 4;
        
        // Efeito gradiente animado no anel
        const time = Date.now() * 0.001;
        const r = Math.sin(time) * 0.5 + 0.5;
        const g = Math.sin(time + 2) * 0.5 + 0.5;
        const b = Math.sin(time + 4) * 0.5 + 0.5;
        ring.material.emissive.setRGB(r, g, b);
        
        requestAnimationFrame(animatePortal);
    }
    animatePortal();
    
    scene.add(portalGroup);
    return portalGroup;
}

// Função para criar mensagem do portal
function createPortalMessage() {
    portalMessageElement = document.createElement('div');
    portalMessageElement.style.position = 'fixed';
    portalMessageElement.style.top = '50%';
    portalMessageElement.style.left = '50%';
    portalMessageElement.style.transform = 'translate(-50%, -50%)';
    portalMessageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    portalMessageElement.style.color = 'white';
    portalMessageElement.style.padding = '20px';
    portalMessageElement.style.borderRadius = '10px';
    portalMessageElement.style.fontFamily = 'Arial, sans-serif';
    portalMessageElement.style.textAlign = 'center';
    portalMessageElement.style.display = 'none';
    portalMessageElement.style.zIndex = '1000';
    
    // Set content based on current language
    const hasPass = window.hasMultiversoPass === true;
    if (currentLanguage === 'PT') {
        portalMessageElement.innerHTML = hasPass 
            ? '<h2>Portal Multiverso</h2><p>Você tem acesso ao terreno exclusivo!</p><p>Bem-vindo ao Multiverso!</p>'
            : '<h2>Portal Multiverso</h2><p>Acesso restrito!</p><p>Você precisa de um Multiverso Pass para acessar esta área.</p>';
    } else {
        portalMessageElement.innerHTML = hasPass 
            ? '<h2>Multiverso Portal</h2><p>You have access to the exclusive terrain!</p><p>Welcome to the Multiverso!</p>'
            : '<h2>Multiverso Portal</h2><p>Restricted access!</p><p>You need a Multiverso Pass to access this area.</p>';
    }
    
    document.body.appendChild(portalMessageElement);
}

// Animation loop
function animate() {
    try {
        requestAnimationFrame(animate);
        
        // Verifica periodicamente o status do Multiverso Pass (a cada 5 segundos)
        if (!window.lastPassCheck || Date.now() - window.lastPassCheck > 5000) {
            window.lastPassCheck = Date.now();
            checkMultiversoPassStatus();
        }
        
        // Atualizar controles
        if (controls) {
            controls.update();
        }
        
        // Verificar acesso ao terreno exclusivo
        const terrainLimit = 7000;
        const isInRestrictedArea = spaceship && spaceship.position.z < -terrainLimit;
        
        // Verificar se o usuário tem um Multiverso Pass
        const hasMultiversoPass = window.hasMultiversoPass === true || window.hasAccess === true;
        
        // Esconder terreno exclusivo se o usuário não tiver um Multiverso Pass
        if (exclusiveLunarTerrain) {
            exclusiveLunarTerrain.visible = hasMultiversoPass;
        }
        
        // VERIFICAÇÃO CRÍTICA DO PLAYER EXCLUSIVO
        // Garantir que o player exclusivo esteja visível para usuários com acesso
        if (exclusiveVideoPlayer && exclusiveVideoPlayer.videoGroup) {
            // Verificar se o player está na cena CSS3D
            if (hasMultiversoPass && cssScene && !cssScene.children.includes(exclusiveVideoPlayer.videoGroup)) {
                console.log('🔴 ALERTA: Player exclusivo não está na cena CSS3D durante animação! Readicionando...');
                cssScene.add(exclusiveVideoPlayer.videoGroup);
                
                // Forçar renderização imediata após readicionar
                if (cssRenderer && cssScene && camera) {
                    cssRenderer.render(cssScene, camera);
                }
            }
            
            // Garantir visibilidade correta
            if (hasMultiversoPass && !exclusiveVideoPlayer.videoGroup.visible) {
                console.log('🔴 ALERTA: Player exclusivo está invisível mas usuário tem acesso! Corrigindo...');
                exclusiveVideoPlayer.videoGroup.visible = true;
            }
            
            // Garantir que os elementos visuais auxiliares estejam visíveis
            if (exclusiveVideoPlayer.marker) exclusiveVideoPlayer.marker.visible = hasMultiversoPass;
            if (exclusiveVideoPlayer.halo) exclusiveVideoPlayer.halo.visible = hasMultiversoPass;
            if (exclusiveVideoPlayer.haloBack) exclusiveVideoPlayer.haloBack.visible = hasMultiversoPass;
            if (exclusiveVideoPlayer.spotLight1) exclusiveVideoPlayer.spotLight1.visible = hasMultiversoPass;
            if (exclusiveVideoPlayer.spotLight2) exclusiveVideoPlayer.spotLight2.visible = hasMultiversoPass;
            
            // Verificar se os elementos DOM ainda existem
            if (hasMultiversoPass && exclusiveVideoPlayer.domElements) {
                const { front, back } = exclusiveVideoPlayer.domElements;
                if (front && !document.body.contains(front)) {
                    console.log('🔴 ALERTA: Elemento DOM frontal não está no documento durante animação! Readicionando...');
                    document.body.appendChild(front);
                }
                
                if (back && !document.body.contains(back)) {
                    console.log('🔴 ALERTA: Elemento DOM traseiro não está no documento durante animação! Readicionando...');
                    document.body.appendChild(back);
                }
            }
        } else if (hasMultiversoPass) {
            // Se o player não existe mas o usuário tem acesso, criar o player
            console.log('🔴 ALERTA: Player exclusivo não existe durante animação mas usuário tem acesso! Criando...');
            exclusiveVideoPlayer = createExclusiveVideoPlayer();
            
            if (exclusiveVideoPlayer && exclusiveVideoPlayer.videoGroup) {
                exclusiveVideoPlayer.videoGroup.visible = true;
                console.log('🔵 Player exclusivo criado durante animação');
                
                // Forçar renderização imediata após criar
                if (cssRenderer && cssScene && camera) {
                    cssRenderer.render(cssScene, camera);
                }
            }
        }
        
        // RENDERIZAÇÃO EXPLÍCITA
        // Renderizar a cena principal
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
        
        // Renderizar a cena CSS3D
        if (cssRenderer && cssScene && camera) {
            cssRenderer.render(cssScene, camera);
        }
    } catch (error) {
        console.error('Erro na animação:', error);
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    
    if (controls) {
        controls.handleResize();
    }
    
    // Forçar renderização imediata após redimensionamento
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
    
    if (cssRenderer && cssScene && camera) {
        cssRenderer.render(cssScene, camera);
        console.log('🔵 Forçando renderização CSS3D após redimensionamento');
    }
}

// Instructions
const instructions = document.createElement('div');
instructions.style.position = 'fixed';
instructions.style.top = '70px'; // Increased top position to be below language button
instructions.style.left = '10px';
instructions.style.color = 'white';
instructions.style.backgroundColor = 'rgba(0,0,0,0.7)'; // Darker background for better visibility
instructions.style.padding = '15px';
instructions.style.borderRadius = '5px';
instructions.style.fontFamily = 'Arial';
instructions.style.zIndex = '1001'; // Higher z-index to ensure visibility
instructions.style.maxWidth = '300px'; // Limit width
instructions.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)'; // Add shadow for better visibility
instructions.style.display = 'block'; // Ensure it's displayed
instructions.id = 'instructions';

// Language selection button
const languageButton = document.createElement('div');
languageButton.style.position = 'fixed';
languageButton.style.top = '10px';
languageButton.style.left = '10px'; // Changed from right to left
languageButton.style.color = 'white';
languageButton.style.backgroundColor = 'rgba(0,0,0,0.8)';
languageButton.style.padding = '10px 15px';
languageButton.style.borderRadius = '5px';
languageButton.style.fontFamily = 'Arial';
languageButton.style.cursor = 'pointer';
languageButton.style.zIndex = '1002'; // Higher z-index to ensure it's above instructions
languageButton.style.border = '1px solid rgba(255,255,255,0.3)';
languageButton.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
languageButton.style.fontSize = '16px';
languageButton.style.fontWeight = 'bold';
languageButton.style.transition = 'all 0.3s ease';
languageButton.style.display = 'block'; // Ensure it's displayed
languageButton.id = 'language-button';
languageButton.innerHTML = '🌐 EN | PT';

// Hover effect
languageButton.addEventListener('mouseover', function() {
    this.style.backgroundColor = 'rgba(50,50,50,0.9)';
    this.style.transform = 'scale(1.05)';
});

languageButton.addEventListener('mouseout', function() {
    this.style.backgroundColor = 'rgba(0,0,0,0.7)';
    this.style.transform = 'scale(1)';
});

document.body.appendChild(languageButton);

// Set default language to Portuguese
let currentLanguage = 'PT';
// Make language available globally
window.currentLanguage = currentLanguage;

// Instructions content in both languages
const instructionsContent = {
    PT: `
        <h3>Controles:</h3>
        W - Mover para frente<br>
        S - Mover para trás<br>
        A - Mover para esquerda<br>
        D - Mover para direita<br>
        Espaço - Subir<br>
        Control - Descer<br>
        Shift - Correr (2x velocidade)<br>
        Mouse - Olhar ao redor<br>
        Click - Ativar controle do mouse
    `,
    EN: `
        <h3>Controls:</h3>
        W - Move forward<br>
        S - Move backward<br>
        A - Move left<br>
        D - Move right<br>
        Space - Move up<br>
        Control - Move down<br>
        Shift - Run (2x speed)<br>
        Mouse - Look around<br>
        Click - Activate mouse control
    `
};

// Function to update instructions based on selected language
function updateLanguage(lang) {
    currentLanguage = lang;
    window.currentLanguage = lang; // Update global variable
    instructions.innerHTML = instructionsContent[lang];
    
    // Update portal message if it exists
    if (portalMessageElement) {
        if (lang === 'PT') {
            const hasPass = window.hasMultiversoPass === true;
            portalMessageElement.innerHTML = hasPass 
                ? '<h2>Portal Multiverso</h2><p>Você tem acesso ao terreno exclusivo!</p><p>Bem-vindo ao Multiverso!</p>'
                : '<h2>Portal Multiverso</h2><p>Acesso restrito!</p><p>Você precisa de um Multiverso Pass para acessar esta área.</p>';
        } else {
            const hasPass = window.hasMultiversoPass === true;
            portalMessageElement.innerHTML = hasPass 
                ? '<h2>Multiverso Portal</h2><p>You have access to the exclusive terrain!</p><p>Welcome to the Multiverso!</p>'
                : '<h2>Multiverso Portal</h2><p>Restricted access!</p><p>You need a Multiverso Pass to access this area.</p>';
        }
    }
    
    // Update wallet connect button text if it exists
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
        if (window.walletConnected) {
            connectBtn.textContent = lang === 'PT' ? 'Carteira Conectada' : 'Wallet Connected';
        } else {
            connectBtn.textContent = lang === 'PT' ? 'Conectar Carteira' : 'Connect Wallet';
        }
    }
    
    // Update verify button text if it exists
    const verifyBtn = document.getElementById('verify-btn');
    if (verifyBtn) {
        verifyBtn.textContent = lang === 'PT' ? 'Verificar Acesso' : 'Verify Access';
    }
    
    // Update close overlay button text if it exists
    const closeOverlayBtn = document.getElementById('close-overlay-btn');
    if (closeOverlayBtn) {
        closeOverlayBtn.textContent = lang === 'PT' ? 'Voltar' : 'Back';
    }
}

// Set initial language
updateLanguage(currentLanguage);

// Add event listener to language button
languageButton.addEventListener('click', function() {
    const newLanguage = currentLanguage === 'PT' ? 'EN' : 'PT';
    updateLanguage(newLanguage);
    
    // Set data attribute on body to trigger observers
    document.body.setAttribute('data-current-language', newLanguage);
    
    // Update language button text
    languageButton.innerHTML = newLanguage === 'PT' ? '🌐 EN | PT' : '🌐 PT | EN';
});

document.body.appendChild(instructions);

// Start the scene
init();

// Atualiza a função de verificação do Multiverso Pass
function updateExclusiveAccess(hasAccess) {
    console.log('🔵 Atualizando acesso exclusivo:', hasAccess ? 'COM ACESSO' : 'SEM ACESSO');
    
    try {
        // Converter para booleano para evitar problemas com valores undefined ou null
        const hasAccessBoolean = hasAccess === true;
        
        // Atualizar variáveis globais
        window.hasMultiversoPass = hasAccessBoolean;
        window.hasAccess = hasAccessBoolean;
        
        console.log('🔵 Status global atualizado: hasMultiversoPass =', window.hasMultiversoPass);
        
        // Atualizar visibilidade do terreno exclusivo
        if (exclusiveLunarTerrain) {
            exclusiveLunarTerrain.visible = hasAccessBoolean;
            console.log('🔵 Terreno exclusivo:', hasAccessBoolean ? 'VISÍVEL' : 'INVISÍVEL');
        } else {
            console.log('🔴 Terreno exclusivo não encontrado!');
        }
        
        // VERIFICAÇÃO CRÍTICA DO PLAYER EXCLUSIVO
        // Atualizar visibilidade do player de vídeo exclusivo
        if (exclusiveVideoPlayer) {
            // Garantir que o grupo de vídeo esteja visível para usuários com acesso
            if (exclusiveVideoPlayer.videoGroup) {
                exclusiveVideoPlayer.videoGroup.visible = hasAccessBoolean;
                console.log('🔵 Grupo de vídeo exclusivo:', hasAccessBoolean ? 'VISÍVEL' : 'INVISÍVEL');
                
                // Se o usuário tem acesso, verificar se o player está realmente na cena CSS3D
                if (hasAccessBoolean && cssScene) {
                    const isInScene = cssScene.children.includes(exclusiveVideoPlayer.videoGroup);
                    if (!isInScene) {
                        console.log('🔴 ALERTA: Player exclusivo não está na cena CSS3D! Readicionando...');
                        cssScene.add(exclusiveVideoPlayer.videoGroup);
                    }
                }
                
                // Forçar a renderização CSS3D para garantir que as mudanças sejam aplicadas
                if (cssRenderer && cssScene && camera) {
                    cssRenderer.render(cssScene, camera);
                    console.log('🔵 Forçando renderização CSS3D após atualização de visibilidade');
                    
                    // Renderizar novamente após um pequeno atraso para garantir
                    setTimeout(() => {
                        if (cssRenderer && cssScene && camera) {
                            cssRenderer.render(cssScene, camera);
                            console.log('🔵 Forçando segunda renderização CSS3D após delay');
                        }
                    }, 500);
                }
            } else {
                console.log('🔴 Grupo de vídeo exclusivo não encontrado!');
            }
            
            // Atualizar visibilidade dos elementos visuais auxiliares
            if (exclusiveVideoPlayer.marker) {
                exclusiveVideoPlayer.marker.visible = hasAccessBoolean;
                console.log('🔵 Marcador de vídeo exclusivo:', hasAccessBoolean ? 'VISÍVEL' : 'INVISÍVEL');
            }
            
            if (exclusiveVideoPlayer.halo) {
                exclusiveVideoPlayer.halo.visible = hasAccessBoolean;
                console.log('🔵 Halo de vídeo exclusivo:', hasAccessBoolean ? 'VISÍVEL' : 'INVISÍVEL');
            }
            
            if (exclusiveVideoPlayer.haloBack) {
                exclusiveVideoPlayer.haloBack.visible = hasAccessBoolean;
                console.log('🔵 Halo traseiro de vídeo exclusivo:', hasAccessBoolean ? 'VISÍVEL' : 'INVISÍVEL');
            }
            
            if (exclusiveVideoPlayer.spotLight1) {
                exclusiveVideoPlayer.spotLight1.visible = hasAccessBoolean;
                console.log('🔵 Luz spot 1 de vídeo exclusivo:', hasAccessBoolean ? 'VISÍVEL' : 'INVISÍVEL');
            }
            
            if (exclusiveVideoPlayer.spotLight2) {
                exclusiveVideoPlayer.spotLight2.visible = hasAccessBoolean;
                console.log('🔵 Luz spot 2 de vídeo exclusivo:', hasAccessBoolean ? 'VISÍVEL' : 'INVISÍVEL');
            }
            
            // Verificar se os elementos DOM ainda existem
            if (hasAccessBoolean && exclusiveVideoPlayer.domElements) {
                const { front, back } = exclusiveVideoPlayer.domElements;
                if (front && !document.body.contains(front)) {
                    console.log('🔴 ALERTA: Elemento DOM frontal não está no documento! Readicionando...');
                    document.body.appendChild(front);
                }
                
                if (back && !document.body.contains(back)) {
                    console.log('🔴 ALERTA: Elemento DOM traseiro não está no documento! Readicionando...');
                    document.body.appendChild(back);
                }
            }
        } else if (hasAccessBoolean) {
            console.log('🔴 Player de vídeo exclusivo não encontrado! Tentando criar...');
            // Tentar criar o player se ele não existir
            exclusiveVideoPlayer = createExclusiveVideoPlayer();
            
            // Definir visibilidade após a criação
            if (exclusiveVideoPlayer && exclusiveVideoPlayer.videoGroup) {
                exclusiveVideoPlayer.videoGroup.visible = true;
                console.log('🔵 Player exclusivo criado e definido como VISÍVEL');
                
                // Forçar a renderização CSS3D após criar o player
                if (cssRenderer && cssScene && camera) {
                    cssRenderer.render(cssScene, camera);
                    console.log('🔵 Forçando renderização CSS3D após criar o player');
                    
                    // Renderizar novamente após um pequeno atraso para garantir
                    setTimeout(() => {
                        if (cssRenderer && cssScene && camera) {
                            cssRenderer.render(cssScene, camera);
                            console.log('🔵 Forçando segunda renderização CSS3D após delay');
                        }
                    }, 500);
                }
            }
        }
        
        // Atualizar mensagem de acesso exclusivo
        updateExclusiveAccessMessage(hasAccessBoolean);
        
        console.log('🔵 Acesso exclusivo atualizado com sucesso');
        
        // Forçar renderização final para garantir que todas as mudanças sejam aplicadas
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
        
        if (cssRenderer && cssScene && camera) {
            cssRenderer.render(cssScene, camera);
            console.log('🔵 Forçando renderização CSS3D final após todas as atualizações');
        }
    } catch (error) {
        console.error('🔴 ERRO ao atualizar acesso exclusivo:', error);
        
        // Em caso de erro, tentar criar um player de emergência
        if (hasAccess) {
            try {
                console.log('🟠 Tentando criar player de emergência...');
                const emergencyPlayer = document.createElement('div');
                emergencyPlayer.id = 'emergency-player';
                emergencyPlayer.style.position = 'fixed';
                emergencyPlayer.style.top = '50%';
                emergencyPlayer.style.left = '50%';
                emergencyPlayer.style.transform = 'translate(-50%, -50%)';
                emergencyPlayer.style.width = '800px';
                emergencyPlayer.style.height = '450px';
                emergencyPlayer.style.backgroundColor = '#000000';
                emergencyPlayer.style.border = '20px solid #FF0000';
                emergencyPlayer.style.borderRadius = '15px';
                emergencyPlayer.style.overflow = 'hidden';
                emergencyPlayer.style.zIndex = '1000';
                
                const emergencyTitle = document.createElement('div');
                emergencyTitle.textContent = '⚠️ CONTEÚDO EXCLUSIVO (MODO DE EMERGÊNCIA) ⚠️';
                emergencyTitle.style.backgroundColor = '#FF0000';
                emergencyTitle.style.color = 'white';
                emergencyTitle.style.padding = '15px';
                emergencyTitle.style.fontSize = '24px';
                emergencyTitle.style.fontWeight = 'bold';
                emergencyTitle.style.textAlign = 'center';
                
                emergencyPlayer.appendChild(emergencyTitle);
                
                const emergencyIframe = document.createElement('iframe');
                emergencyIframe.style.width = '100%';
                emergencyIframe.style.height = '396px';
                emergencyIframe.style.border = 'none';
                emergencyIframe.src = 'https://iframe.mediadelivery.net/embed/203779/9cc1bfec-5e6a-4a5e-b02f-8d7f6dcc9a4c?autoplay=true&loop=true&muted=false';
                emergencyIframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                emergencyIframe.allowFullscreen = true;
                
                emergencyPlayer.appendChild(emergencyIframe);
                document.body.appendChild(emergencyPlayer);
                
                console.log('🔵 Player de emergência criado com sucesso');
            } catch (emergencyError) {
                console.error('🔴 ERRO ao criar player de emergência:', emergencyError);
            }
        }
    }
}

// ... existing code ...

// Remove qualquer outro event listener que possa estar adicionando botões
window.removeEventListener('load', window.configurarInteracaoUI);
window.configurarInteracaoUI = undefined; 

// Função para criar textura de lensflare proceduralmente
function createLensflareTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Limpa o canvas
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Cria gradiente radial para o lensflare
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;
    
    // Gradiente principal
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.1, 'rgba(255, 230, 200, 0.8)');
    gradient.addColorStop(0.2, 'rgba(255, 200, 150, 0.5)');
    gradient.addColorStop(0.3, 'rgba(255, 170, 100, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 120, 50, 0.1)');
    gradient.addColorStop(1.0, 'rgba(255, 100, 50, 0.0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Adiciona alguns círculos concêntricos
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    
    for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * i * 0.15, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Adiciona alguns raios
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const startX = centerX + Math.cos(angle) * radius * 0.2;
        const startY = centerY + Math.sin(angle) * radius * 0.2;
        const endX = centerX + Math.cos(angle) * radius * 0.8;
        const endY = centerY + Math.sin(angle) * radius * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
    
    // Cria textura a partir do canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
}

// Função para criar textura de partícula de poeira proceduralmente
function createDustParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Limpa o canvas
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Cria gradiente radial para a partícula
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;
    
    // Gradiente principal
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Cria textura a partir do canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
}

// ... existing code ...
function createMintButton() {
    // Remover qualquer botão existente para evitar duplicatas
    const existingButton = document.getElementById('mint-multiverso-pass-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Criar elemento DOM para o botão Mint como um link <a> para garantir clicabilidade
    const mintButtonElement = document.createElement('a');
    mintButtonElement.id = 'mint-multiverso-pass-button';
    mintButtonElement.href = 'https://inscribenow.io/collections/38ad28c5d73e92ec';
    mintButtonElement.target = '_blank'; // Abrir em nova aba
    mintButtonElement.style.width = '400px'; // Botão mais largo
    mintButtonElement.style.height = '100px'; // Botão mais alto
    mintButtonElement.style.backgroundColor = '#FF6600'; // Cor laranja
    mintButtonElement.style.border = '8px solid #FFD700'; // Borda dourada mais grossa
    mintButtonElement.style.borderRadius = '20px'; // Bordas mais arredondadas
    mintButtonElement.style.overflow = 'hidden';
    mintButtonElement.style.cursor = 'pointer'; // Garantir que o cursor seja uma mão
    mintButtonElement.style.pointerEvents = 'auto'; // Garantir que eventos de ponteiro sejam capturados
    mintButtonElement.style.boxShadow = '0 0 30px #FFD700, 0 0 60px #FF6600'; // Brilho dourado mais intenso com duplo halo
    mintButtonElement.style.transition = 'all 0.3s ease';
    mintButtonElement.style.display = 'block'; // Garantir que seja um bloco
    mintButtonElement.style.textDecoration = 'none'; // Remover sublinhado do link
    
    // Texto do botão
    const textElement = document.createElement('div');
    textElement.textContent = '🔥🔥 MINT MULTIVERSO PASS 🔥🔥'; // Mais emojis para chamar atenção
    textElement.style.color = 'white';
    textElement.style.padding = '10px';
    textElement.style.fontSize = '24px'; // Texto maior
    textElement.style.fontWeight = 'bold';
    textElement.style.textAlign = 'center';
    textElement.style.lineHeight = '80px'; // Ajustado para o novo tamanho
    textElement.style.textShadow = '0 0 10px #FFD700, 0 0 20px #FFD700'; // Sombra de texto dourada mais intensa
    mintButtonElement.appendChild(textElement);
    
    // Adicionar evento de hover
    mintButtonElement.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#FF8C00'; // Laranja mais claro no hover
        this.style.transform = 'scale(1.1)'; // Efeito de escala maior
        this.style.boxShadow = '0 0 40px #FFD700, 0 0 80px #FF6600'; // Brilho mais intenso
    });
    
    mintButtonElement.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#FF6600'; // Volta ao laranja original
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 0 30px #FFD700, 0 0 60px #FF6600'; // Brilho normal
    });
    
    // Adicionar evento de clique explícito para garantir que o link seja aberto
    mintButtonElement.addEventListener('click', function(event) {
        console.log('Botão Mint clicado! Abrindo link...');
        window.open('https://inscribenow.io/collections/38ad28c5d73e92ec', '_blank');
        event.stopPropagation(); // Impedir que o evento se propague para o renderer
    });
    
    // Criar um wrapper para o botão para melhorar a clicabilidade
    const buttonWrapper = document.createElement('div');
    buttonWrapper.style.width = '100%';
    buttonWrapper.style.height = '100%';
    buttonWrapper.style.position = 'relative';
    buttonWrapper.appendChild(mintButtonElement);
    
    // Criar objeto CSS3D para o wrapper do botão
    const mintButtonObject = new CSS3DObject(buttonWrapper);
    
    // Posicionar o botão diretamente acima do portal
    // O portal está em (0, 1600, -7000)
    // A seta triângulo está em y = 2133 + 1600 (posição do portal)
    const terrainLimit = 7000;
    const portalY = 1600;
    const markerY = 2133; // Altura da seta triângulo em relação ao portal
    const markerMaxY = Math.sin(Date.now() * 0.002) * 267; // Altura máxima da animação da seta
    
    // Posicionar o botão 400 unidades acima da seta triângulo
    // Isso garante que ele fique visível e alinhado com o portal
    const buttonY = portalY + markerY + markerMaxY + 400;
    mintButtonObject.position.set(0, buttonY, -terrainLimit);
    
    // Aumentar o tamanho do botão para garantir melhor visibilidade
    mintButtonObject.scale.set(7, 7, 7);
    
    // Adicionar o botão à cena CSS
    cssScene.add(mintButtonObject);
    
    // Adicionar luz de destaque para o botão (ajustada para a nova posição)
    const mintButtonLight = new THREE.PointLight(0xFF6600, 3, 3000);
    mintButtonLight.position.set(0, buttonY, -terrainLimit + 200);
    scene.add(mintButtonLight);
    
    // Criar um grupo para conter a luz
    const mintButtonGroup = new THREE.Group();
    mintButtonGroup.add(mintButtonLight);
    
    // Animação pulsante para a luz
    function animateMintButtonLight() {
        mintButtonLight.intensity = 3 + Math.sin(Date.now() * 0.005) * 2; // Animação mais intensa
        requestAnimationFrame(animateMintButtonLight);
    }
    
    // Iniciar a animação da luz
    animateMintButtonLight();
    
    // Adicionar evento global para garantir que o botão seja clicável
    document.addEventListener('click', function(event) {
        // Verificar se o clique foi no botão ou em seus elementos filhos
        if (event.target === mintButtonElement || 
            event.target === textElement || 
            mintButtonElement.contains(event.target)) {
            console.log('Clique global no botão Mint detectado! Abrindo link...');
            window.open('https://inscribenow.io/collections/38ad28c5d73e92ec', '_blank');
            event.stopPropagation(); // Impedir que o evento se propague
        }
    }, true); // Usar captura para garantir que o evento seja processado antes
    
    console.log("Botão Mint criado e posicionado em:", 0, buttonY, -terrainLimit);
    
    return mintButtonObject;
}

// ... existing code ...

// Adicionar raycaster para detectar quando o mouse está sobre o botão

// Função para verificar se o mouse está sobre o botão Mint
function checkMintButtonHover(event) {
    // Calcular a posição do mouse em coordenadas normalizadas (-1 a +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    
    // Atualizar o raycaster com a posição do mouse e a câmera
    uiRaycaster.setFromCamera(mouse, camera);
    
    // Verificar se o raio intersecta com o botão Mint
    const mintButton = document.getElementById('mint-multiverso-pass-button');
    if (mintButton) {
        // Obter a posição do botão no espaço 3D
        const terrainLimit = 7000;
        const portalY = 1600;
        const markerY = 2133; // Altura da seta triângulo em relação ao portal
        const markerMaxY = Math.sin(Date.now() * 0.002) * 267; // Altura máxima da animação da seta
        const buttonY = portalY + markerY + markerMaxY + 400;
        const buttonPosition = new THREE.Vector3(0, buttonY, -terrainLimit);
        
        // Calcular a distância entre o raio e a posição do botão
        const distance = uiRaycaster.ray.distanceToPoint(buttonPosition);
        
        // Se a distância for menor que um certo valor, consideramos que o mouse está sobre o botão
        if (distance < 1500) { // Aumentamos a área de detecção
            document.body.style.cursor = 'pointer'; // Mudar o cursor para uma mão
        } else {
            document.body.style.cursor = 'auto'; // Voltar o cursor para o padrão
        }
    }
}

// Adicionar evento de movimento do mouse para verificar hover no botão
window.addEventListener('mousemove', checkMintButtonHover);

// ... existing code ...

// Função para criar o player de vídeo exclusivo para hodlers
function createExclusiveVideoPlayer() {
    // Registramos o início da criação do player exclusivo
    console.log('🔵 INICIO: Criando player de vídeo exclusivo para hodlers - SOLUÇÃO DEFINITIVA');
    
    try {
        // Limpeza completa de qualquer player existente
        // Removemos elementos DOM antigos
        document.querySelectorAll('.exclusive-video-player').forEach(el => el.remove());
        document.querySelectorAll('[id^="exclusive-video-"]').forEach(el => el.remove());
        
        // Removemos objetos 3D relacionados ao player anterior
        scene.children.forEach(child => {
            if (child.name && (
                child.name.includes('exclusive-video-marker') || 
                child.name.includes('exclusive-video-backup') ||
                child.name.includes('exclusive-video-particles') ||
                child.name.includes('exclusive-video-halo') ||
                child.name.includes('exclusive-video-ambient') ||
                child.name.includes('exclusive-video-light')
            )) {
                scene.remove(child);
                console.log('🔵 Removido objeto 3D antigo:', child.name);
            }
        });
        
        // Removemos grupos antigos da cena CSS3D
        cssScene.children.forEach(child => {
            if (child.name && child.name.includes('exclusive-video-group')) {
                cssScene.remove(child);
                console.log('🔵 Removido grupo CSS3D antigo:', child.name);
            }
        });
        
        // Definimos dimensões e posicionamento precisos
        const EXCLUSIVE_VIDEO_WIDTH = 900;
        const EXCLUSIVE_VIDEO_HEIGHT = 500;
        const terrainLimit = 7000;
        
        // Posicionamos o player no centro do terreno exclusivo, mais próximo do portal
        // Usamos coordenadas absolutas para evitar problemas de referência
        const playerZ = -terrainLimit - 3000; // Posição Z ajustada para ficar mais próximo do portal
        const playerY = 1500;   // Altura ajustada para maior visibilidade
        const playerX = 0;      // Centralizado no eixo X
        
        console.log('🔵 Posicionando player em coordenadas absolutas: X=' + playerX + ', Y=' + playerY + ', Z=' + playerZ);
        
        // ABORDAGEM 1: CRIAÇÃO DO PLAYER CSS3D
        // Criamos o elemento DOM para o player (frente)
        const videoElement = document.createElement('div');
        videoElement.className = 'exclusive-video-player';
        videoElement.style.width = EXCLUSIVE_VIDEO_WIDTH + 'px';
        videoElement.style.height = EXCLUSIVE_VIDEO_HEIGHT + 'px';
        videoElement.style.backgroundColor = '#000000';
        videoElement.style.border = '20px solid #FF00FF'; // Magenta puro para máxima visibilidade
        videoElement.style.borderRadius = '15px';
        videoElement.style.overflow = 'hidden';
        videoElement.style.pointerEvents = 'auto';
        videoElement.style.boxShadow = '0 0 50px #FF00FF, 0 0 100px #FF00FF'; // Brilho duplo mais intenso
        
        // Título do player exclusivo com animação
        const titleElement = document.createElement('div');
        titleElement.textContent = '✨ CONTEÚDO EXCLUSIVO PARA HODLERS ✨';
        titleElement.style.backgroundColor = '#FF00FF'; // Magenta puro
        titleElement.style.color = 'white';
        titleElement.style.padding = '15px';
        titleElement.style.fontSize = '24px';
        titleElement.style.fontWeight = 'bold';
        titleElement.style.textAlign = 'center';
        titleElement.style.textShadow = '0 0 10px white'; // Adiciona brilho ao texto
        
        // Adicionamos animação diretamente no elemento
        titleElement.style.animation = 'pulse 1s infinite';
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            @keyframes pulse {
                0% { opacity: 0.7; }
                50% { opacity: 1; }
                100% { opacity: 0.7; }
            }
        `;
        document.head.appendChild(styleElement);
        
        videoElement.appendChild(titleElement);
        
        // Iframe do player exclusivo integrado com o Bunny
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = (EXCLUSIVE_VIDEO_HEIGHT - 54) + 'px';
        iframe.style.border = 'none';
        
        // URL do Bunny com uma biblioteca de vídeos específica
        iframe.src = 'https://iframe.mediadelivery.net/embed/203779/9cc1bfec-5e6a-4a5e-b02f-8d7f6dcc9a4c?autoplay=true&loop=true&muted=false';
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        
        // Adicionamos iframe ao elemento DOM
        videoElement.appendChild(iframe);
        
        // Criamos o elemento DOM para o player (verso)
        const videoElementBack = videoElement.cloneNode(true);
        
        // Garantimos IDs exclusivos com timestamp para evitar conflitos
        const videoId = 'exclusive-video-' + Date.now();
        videoElement.id = videoId + '-front';
        videoElementBack.id = videoId + '-back';
        
        // IMPORTANTE: Adicionamos elementos ao DOM antes de criar objetos 3D
        document.body.appendChild(videoElement);
        document.body.appendChild(videoElementBack);
        
        // Escondemos elementos do DOM visível (serão renderizados pelo CSS3D)
        videoElement.style.position = 'absolute';
        videoElement.style.left = '-9999px';
        videoElementBack.style.position = 'absolute';
        videoElementBack.style.left = '-9999px';
        
        console.log('🔵 Elementos DOM criados com sucesso:', videoElement.id, videoElementBack.id);
        
        // Criamos o grupo para conter os dois lados do player
        const videoGroup = new THREE.Group();
        videoGroup.name = 'exclusive-video-group-' + Date.now();
        
        // Criamos o objeto CSS3D para frente
        const videoObject = new CSS3DObject(videoElement);
        videoObject.position.set(playerX, playerY, playerZ);
        videoObject.scale.set(3, 3, 3); // Escala aumentada para maior visibilidade
        
        // Criamos o objeto CSS3D para verso
        const videoObjectBack = new CSS3DObject(videoElementBack);
        videoObjectBack.position.set(playerX, playerY, playerZ - 1); // 1 unidade atrás para evitar z-fighting
        videoObjectBack.scale.set(3, 3, 3);
        videoObjectBack.rotation.y = Math.PI; // Rotaciona 180 graus
        
        // Adicionamos os dois lados ao grupo
        videoGroup.add(videoObject);
        videoGroup.add(videoObjectBack);
        
        // CRUCIAL: Adicionamos explicitamente à cena CSS3D
        cssScene.add(videoGroup);
        
        console.log('🔵 Player CSS3D adicionado à cena. Group ID:', videoGroup.id, 'Group Name:', videoGroup.name);
        
        // ABORDAGEM 2: ELEMENTOS VISUAIS AUXILIARES
        // Criamos um marcador visual acima do player
        const markerGeometry = new THREE.SphereGeometry(300, 32, 32);
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF00FF,
            transparent: true,
            opacity: 0.9,
            emissive: 0xFF00FF,
            emissiveIntensity: 2
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(playerX, playerY + 500, playerZ);
        marker.name = 'exclusive-video-marker';
        scene.add(marker);
        
        // Criamos um plano de backup como fallback visual
        const planeGeometry = new THREE.PlaneGeometry(EXCLUSIVE_VIDEO_WIDTH * 2, EXCLUSIVE_VIDEO_HEIGHT * 2);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF00FF,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.set(playerX, playerY, playerZ + 10);
        plane.name = 'exclusive-video-backup-plane';
        scene.add(plane);
        
        // Adicionamos luzes intensas para iluminar o player
        const spotLight1 = new THREE.SpotLight(0xFF00FF, 30);
        spotLight1.position.set(playerX - 200, playerY + 500, playerZ - 200);
        spotLight1.target.position.set(playerX, playerY, playerZ);
        spotLight1.angle = Math.PI / 2;
        spotLight1.penumbra = 0.2;
        spotLight1.distance = 10000;
        spotLight1.name = 'exclusive-video-light-1';
        scene.add(spotLight1);
        scene.add(spotLight1.target);
        
        const spotLight2 = new THREE.SpotLight(0xFF00FF, 30);
        spotLight2.position.set(playerX + 200, playerY + 500, playerZ - 200);
        spotLight2.target.position.set(playerX, playerY, playerZ);
        spotLight2.angle = Math.PI / 2;
        spotLight2.penumbra = 0.2;
        spotLight2.distance = 10000;
        spotLight2.name = 'exclusive-video-light-2';
        scene.add(spotLight2);
        scene.add(spotLight2.target);
        
        // Adicionamos uma luz ambiente para garantir visibilidade
        const ambientLight = new THREE.AmbientLight(0xFF00FF, 2);
        ambientLight.position.set(playerX, playerY, playerZ);
        ambientLight.name = 'exclusive-video-ambient';
        scene.add(ambientLight);
        
        // Criamos partículas brilhantes ao redor do player
        const particleCount = 2000;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Distribuímos partículas em uma esfera ao redor do player
        for (let i = 0; i < particleCount; i++) {
            const radius = 800;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta) + playerX;
            particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + playerY;
            particlePositions[i * 3 + 2] = radius * Math.cos(phi) + playerZ;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xFF00FF,
            size: 30,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        particles.name = 'exclusive-video-particles';
        scene.add(particles);
        
        // Adicionamos um halo ao redor do player
        const haloGeometry = new THREE.RingGeometry(500, 1000, 32);
        const haloMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF00FF,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        halo.position.set(playerX, playerY, playerZ - 50);
        halo.rotation.x = Math.PI / 2;
        halo.name = 'exclusive-video-halo';
        scene.add(halo);
        
        // ABORDAGEM 3: PLAYER HTML DIRETO (FALLBACK)
        // Criamos um elemento HTML fixo como último recurso
        const fixedPlayerContainer = document.createElement('div');
        fixedPlayerContainer.id = 'fixed-exclusive-player';
        fixedPlayerContainer.style.position = 'fixed';
        fixedPlayerContainer.style.top = '50%';
        fixedPlayerContainer.style.left = '50%';
        fixedPlayerContainer.style.transform = 'translate(-50%, -50%)';
        fixedPlayerContainer.style.width = EXCLUSIVE_VIDEO_WIDTH + 'px';
        fixedPlayerContainer.style.height = EXCLUSIVE_VIDEO_HEIGHT + 'px';
        fixedPlayerContainer.style.backgroundColor = '#000000';
        fixedPlayerContainer.style.border = '20px solid #FF00FF';
        fixedPlayerContainer.style.borderRadius = '15px';
        fixedPlayerContainer.style.overflow = 'hidden';
        fixedPlayerContainer.style.zIndex = '1000';
        fixedPlayerContainer.style.boxShadow = '0 0 50px #FF00FF, 0 0 100px #FF00FF';
        fixedPlayerContainer.style.display = 'none'; // Inicialmente oculto
        
        // Título para o player fixo
        const fixedTitleElement = document.createElement('div');
        fixedTitleElement.textContent = '✨ CONTEÚDO EXCLUSIVO PARA HODLERS ✨';
        fixedTitleElement.style.backgroundColor = '#FF00FF';
        fixedTitleElement.style.color = 'white';
        fixedTitleElement.style.padding = '15px';
        fixedTitleElement.style.fontSize = '24px';
        fixedTitleElement.style.fontWeight = 'bold';
        fixedTitleElement.style.textAlign = 'center';
        fixedTitleElement.style.textShadow = '0 0 10px white';
        fixedTitleElement.style.animation = 'pulse 1s infinite';
        
        fixedPlayerContainer.appendChild(fixedTitleElement);
        
        // Iframe para o player fixo
        const fixedIframe = document.createElement('iframe');
        fixedIframe.style.width = '100%';
        fixedIframe.style.height = (EXCLUSIVE_VIDEO_HEIGHT - 54) + 'px';
        fixedIframe.style.border = 'none';
        fixedIframe.src = 'https://iframe.mediadelivery.net/embed/203779/9cc1bfec-5e6a-4a5e-b02f-8d7f6dcc9a4c?autoplay=true&loop=true&muted=false';
        fixedIframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        fixedIframe.allowFullscreen = true;
        
        fixedPlayerContainer.appendChild(fixedIframe);
        
        // Botão para fechar o player fixo
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.backgroundColor = '#FF00FF';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '50%';
        closeButton.style.width = '30px';
        closeButton.style.height = '30px';
        closeButton.style.fontSize = '16px';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.cursor = 'pointer';
        closeButton.style.zIndex = '1001';
        
        closeButton.addEventListener('click', () => {
            fixedPlayerContainer.style.display = 'none';
        });
        
        fixedPlayerContainer.appendChild(closeButton);
        
        // Botão para reabrir o player fixo
        const reopenButton = document.createElement('button');
        reopenButton.id = 'reopen-exclusive-video';
        reopenButton.textContent = '🎬 Abrir Vídeo Exclusivo';
        reopenButton.style.position = 'fixed';
        reopenButton.style.bottom = '20px';
        reopenButton.style.right = '20px';
        reopenButton.style.backgroundColor = '#FF00FF';
        reopenButton.style.color = 'white';
        reopenButton.style.border = 'none';
        reopenButton.style.borderRadius = '8px';
        reopenButton.style.padding = '10px 20px';
        reopenButton.style.fontSize = '16px';
        reopenButton.style.fontWeight = 'bold';
        reopenButton.style.cursor = 'pointer';
        reopenButton.style.zIndex = '1000';
        reopenButton.style.display = 'none'; // Inicialmente oculto
        
        reopenButton.addEventListener('click', () => {
            fixedPlayerContainer.style.display = 'block';
            reopenButton.style.display = 'none';
        });
        
        document.body.appendChild(fixedPlayerContainer);
        document.body.appendChild(reopenButton);
        
        // ANIMAÇÕES E MONITORAMENTO
        // Função para animar os elementos visuais
        function animateElements() {
            const animationId = requestAnimationFrame(animateElements);
            const time = Date.now() * 0.001;
            
            // Animamos o marcador
            if (marker) {
                marker.position.y = playerY + 500 + Math.sin(time) * 200;
                marker.scale.setScalar(1 + Math.sin(time * 0.5) * 0.7);
            }
            
            // Animamos o halo
            if (halo) {
                halo.scale.set(
                    1 + Math.sin(time * 0.7) * 0.5,
                    1 + Math.sin(time * 0.7) * 0.5,
                    1
                );
                halo.rotation.z = time * 0.5;
                haloMaterial.opacity = 0.5 + Math.sin(time) * 0.5;
            }
            
            // Animamos as partículas
            if (particles && particles.geometry.attributes.position) {
                const positions = particles.geometry.attributes.position.array;
                for (let i = 0; i < particleCount; i++) {
                    positions[i * 3] += Math.sin(time + i * 0.01) * 2;
                    positions[i * 3 + 1] += Math.cos(time + i * 0.01) * 2;
                    positions[i * 3 + 2] += Math.sin(time * 0.5 + i * 0.01) * 2;
                    
                    // Reposicionamos partículas que saem muito do limite
                    const distance = Math.sqrt(
                        Math.pow(positions[i * 3] - playerX, 2) +
                        Math.pow(positions[i * 3 + 1] - playerY, 2) +
                        Math.pow(positions[i * 3 + 2] - playerZ, 2)
                    );
                    
                    if (distance > 1000) {
                        const radius = 800;
                        const theta = Math.random() * Math.PI * 2;
                        const phi = Math.random() * Math.PI;
                        
                        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta) + playerX;
                        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + playerY;
                        positions[i * 3 + 2] = radius * Math.cos(phi) + playerZ;
                    }
                }
                particles.geometry.attributes.position.needsUpdate = true;
            }
            
            // Armazenamos o ID da animação para poder cancelá-la se necessário
            videoGroup.userData.animationId = animationId;
        }
        
        // Iniciamos as animações
        animateElements();
        
        // Sistema de monitoramento e recuperação
        const debugInterval = setInterval(() => {
            // Verificamos se o usuário tem acesso
            const hasAccess = window.hasMultiversoPass === true || window.hasAccess === true;
            
            // Verificamos se o grupo ainda faz parte da cena CSS3D
            const isInScene = cssScene.children.includes(videoGroup);
            if (!isInScene && hasAccess) {
                console.log('🔴 ALERTA: Player exclusivo foi removido da cena CSS3D!');
                cssScene.add(videoGroup); // Readicionamos à cena
                console.log('🔵 Player readicionado à cena CSS3D');
                
                // Forçamos renderização após readicionar
                if (cssRenderer && cssScene && camera) {
                    cssRenderer.render(cssScene, camera);
                }
            }
            
            // Verificamos visibilidade
            const visibilityStatus = videoGroup.visible ? 'visível' : 'invisível';
            console.log(`🔵 Status do player exclusivo: ${visibilityStatus}, Acesso: ${hasAccess}`);
            
            // Verificamos se os elementos DOM ainda existem
            const domElementFront = document.getElementById(videoId + '-front');
            const domElementBack = document.getElementById(videoId + '-back');
            
            if ((!domElementFront || !domElementBack) && hasAccess) {
                console.log('🔴 ALERTA: Elementos DOM do player foram removidos!');
                
                // Recriamos os elementos removidos
                if (!domElementFront) {
                    document.body.appendChild(videoElement);
                    console.log('🔵 Elemento DOM frontal recriado');
                }
                
                if (!domElementBack) {
                    document.body.appendChild(videoElementBack);
                    console.log('🔵 Elemento DOM traseiro recriado');
                }
                
                // Forçamos renderização após recriar elementos
                if (cssRenderer && cssScene && camera) {
                    cssRenderer.render(cssScene, camera);
                }
            }
            
            // Verificamos se o player CSS3D está funcionando, caso contrário ativamos o fallback
            if (hasAccess && (!isInScene || !domElementFront || !domElementBack)) {
                console.log('🔴 ALERTA: Player CSS3D não está funcionando corretamente! Ativando fallback HTML...');
                fixedPlayerContainer.style.display = 'block';
            }
            
            // Forçamos renderização CSS3D periodicamente
            if (cssRenderer && cssScene && camera && hasAccess) {
                cssRenderer.render(cssScene, camera);
                console.log('🔵 Forçando re-renderização CSS3D periódica');
            }
        }, 5000); // Verificação a cada 5 segundos
        
        // FORÇAMOS RENDERIZAÇÃO INICIAL
        // Isso é crucial para garantir que o player seja exibido imediatamente
        if (cssRenderer && cssScene && camera) {
            cssRenderer.render(cssScene, camera);
            console.log('🔵 Forçando renderização CSS3D inicial');
            
            // Renderizamos novamente após um pequeno atraso para garantir
            setTimeout(() => {
                if (cssRenderer && cssScene && camera) {
                    cssRenderer.render(cssScene, camera);
                    console.log('🔵 Forçando segunda renderização CSS3D após delay');
                }
            }, 500);
        }
        
        console.log('🔵 Player exclusivo criado com sucesso. Iniciando animações e monitoramento.');
        
        // Retornamos todas as referências para controle
        return {
            videoGroup,
            videoObject,
            videoObjectBack,
            marker,
            particles,
            halo,
            plane,
            ambientLight,
            spotLight1,
            spotLight2,
            fixedPlayerContainer,
            reopenButton,
            debugInterval,
            position: { x: playerX, y: playerY, z: playerZ },
            domElements: { front: videoElement, back: videoElementBack }
        };
    } catch (error) {
        console.error('🔴 ERRO ao criar player exclusivo:', error);
        
        // Em caso de erro, criamos um marcador de emergência
        const emergencyMarker = new THREE.Mesh(
            new THREE.SphereGeometry(500, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xFF0000, transparent: true, opacity: 0.8 })
        );
        emergencyMarker.position.set(0, 1500, -10000);
        emergencyMarker.name = 'emergency-marker';
        scene.add(emergencyMarker);
        
        // Ativamos o player HTML como fallback de emergência
        const emergencyPlayer = document.createElement('div');
        emergencyPlayer.id = 'emergency-player';
        emergencyPlayer.style.position = 'fixed';
        emergencyPlayer.style.top = '50%';
        emergencyPlayer.style.left = '50%';
        emergencyPlayer.style.transform = 'translate(-50%, -50%)';
        emergencyPlayer.style.width = '900px';
        emergencyPlayer.style.height = '500px';
        emergencyPlayer.style.backgroundColor = '#000000';
        emergencyPlayer.style.border = '20px solid #FF0000';
        emergencyPlayer.style.borderRadius = '15px';
        emergencyPlayer.style.overflow = 'hidden';
        emergencyPlayer.style.zIndex = '1000';
        emergencyPlayer.style.boxShadow = '0 0 50px #FF0000';
        emergencyPlayer.style.display = 'none'; // Inicialmente oculto
        
        const emergencyTitle = document.createElement('div');
        emergencyTitle.textContent = '⚠️ CONTEÚDO EXCLUSIVO (MODO DE EMERGÊNCIA) ⚠️';
        emergencyTitle.style.backgroundColor = '#FF0000';
        emergencyTitle.style.color = 'white';
        emergencyTitle.style.padding = '15px';
        emergencyTitle.style.fontSize = '24px';
        emergencyTitle.style.fontWeight = 'bold';
        emergencyTitle.style.textAlign = 'center';
        
        emergencyPlayer.appendChild(emergencyTitle);
        
        const emergencyIframe = document.createElement('iframe');
        emergencyIframe.style.width = '100%';
        emergencyIframe.style.height = '446px';
        emergencyIframe.style.border = 'none';
        emergencyIframe.src = 'https://iframe.mediadelivery.net/embed/203779/9cc1bfec-5e6a-4a5e-b02f-8d7f6dcc9a4c?autoplay=true&loop=true&muted=false';
        emergencyIframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        emergencyIframe.allowFullscreen = true;
        
        emergencyPlayer.appendChild(emergencyIframe);
        document.body.appendChild(emergencyPlayer);
        
        // Verificamos periodicamente se o usuário tem acesso para mostrar o player de emergência
        const emergencyInterval = setInterval(() => {
            const hasAccess = window.hasMultiversoPass === true || window.hasAccess === true;
            if (hasAccess) {
                emergencyPlayer.style.display = 'block';
            } else {
                emergencyPlayer.style.display = 'none';
            }
        }, 2000);
        
        return {
            videoGroup: null,
            marker: emergencyMarker,
            emergencyPlayer,
            emergencyInterval,
            position: { x: 0, y: 1500, z: -10000 }
        };
    }
}

// ... existing code ...

// Função para atualizar a mensagem de acesso exclusivo
function updateExclusiveAccessMessage(hasAccess) {
    console.log('🔵 Atualizando mensagem de acesso exclusivo:', hasAccess ? 'COM ACESSO' : 'SEM ACESSO');
    
    try {
        // Atualiza a mensagem do portal se estiver visível
        if (portalMessageElement && portalMessageElement.style.display === 'block') {
            if (currentLanguage === 'PT') {
                portalMessageElement.innerHTML = hasAccess 
                    ? '<h2>Portal Multiverso</h2><p>Você tem acesso ao terreno exclusivo!</p><p>Bem-vindo ao Multiverso!</p>'
                    : '<h2>Portal Multiverso</h2><p>Acesso restrito!</p><p>Você precisa de um Multiverso Pass para acessar esta área.</p>';
            } else {
                portalMessageElement.innerHTML = hasAccess 
                    ? '<h2>Multiverso Portal</h2><p>You have access to the exclusive terrain!</p><p>Welcome to the Multiverso!</p>'
                    : '<h2>Multiverso Portal</h2><p>Restricted access!</p><p>You need a Multiverso Pass to access this area.</p>';
            }
            console.log('🔵 Mensagem do portal atualizada');
        }
        
        // Força uma renderização para garantir que as mudanças sejam aplicadas imediatamente
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
        
        // Verifica se a nave está na área restrita e o acesso foi revogado
        if (!hasAccess && spaceship) {
            const terrainLimit = 7000;
            
            if (spaceship.position.z < -terrainLimit) {
                console.log('🔴 Acesso revogado enquanto na área restrita. Teleportando para área segura...');
                // Teleportar a nave de volta para a área segura, próximo ao portal
                spaceship.position.set(0, 800, -terrainLimit + 500);
                
                // Mostrar mensagem de aviso
                const statusMsg = document.createElement('div');
                statusMsg.style.position = 'fixed';
                statusMsg.style.top = '50%';
                statusMsg.style.left = '50%';
                statusMsg.style.transform = 'translate(-50%, -50%)';
                statusMsg.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                statusMsg.style.color = '#ff0000';
                statusMsg.style.padding = '20px';
                statusMsg.style.borderRadius = '10px';
                statusMsg.style.fontFamily = 'Arial';
                statusMsg.style.fontSize = '24px';
                statusMsg.style.zIndex = '1000';
                statusMsg.innerHTML = currentLanguage === 'PT' 
                    ? '⚠️ Acesso revogado! Você foi teleportado para a área segura.'
                    : '⚠️ Access revoked! You have been teleported to the safe area.';
                document.body.appendChild(statusMsg);
                
                // Remove a mensagem após 5 segundos
                setTimeout(() => {
                    document.body.removeChild(statusMsg);
                }, 5000);
            }
        }
    } catch (error) {
        console.error('🔴 ERRO ao atualizar mensagem de acesso exclusivo:', error);
    }
}

// Função para verificar explicitamente o status do Multiverso Pass
function checkMultiversoPassStatus() {
    // Verifica se a variável global está definida corretamente
    // Verifica tanto hasMultiversoPass quanto hasAccess para compatibilidade
    const hasPass = window.hasMultiversoPass === true || window.hasAccess === true;
    
    console.log('🔵 Verificação explícita do Multiverso Pass:', hasPass);
    console.log('window.hasMultiversoPass =', window.hasMultiversoPass);
    console.log('window.hasAccess =', window.hasAccess);
    
    // Atualiza o acesso exclusivo com o status atual
    updateExclusiveAccess(hasPass);
    
    return hasPass;
}

// ... existing code ...

