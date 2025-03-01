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
cssRenderer.domElement.style.pointerEvents = 'auto'; // Permitir interação com elementos CSS3D
cssRenderer.domElement.style.zIndex = '2'; // Garante que fique sobre o WebGLRenderer
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

// Adicionar variável global para o botão
let mintButton;

// Constantes para o player de vídeo da área exclusiva
const HODLER_VIDEO_WIDTH = 800;
const HODLER_VIDEO_HEIGHT = 500;
// Posição atualizada para ficar acima do terreno lunar exclusivo
const HODLER_VIDEO_POSITION = { x: 0, y: 3500, z: -20000 }; // Posicionado mais alto e mais distante para melhor visibilidade

// Lista de vídeos disponíveis no Bunny
const hodlerVideos = [
    { 
        id: 'b98c3c67-402c-4471-9a9e-7fb2a1917ea8', 
        title: 'Aula 1: Introdução ao Bitcoin', 
        url: 'https://iframe.mediadelivery.net/embed/249011/b98c3c67-402c-4471-9a9e-7fb2a1917ea8?autoplay=false' 
    },
    { 
        id: '7fb2a1917ea8-402c-4471-9a9e-b98c3c67', 
        title: 'Aula 2: Blockchain e Consenso', 
        url: 'https://iframe.mediadelivery.net/embed/249011/b98c3c67-402c-4471-9a9e-7fb2a1917ea8?autoplay=false' 
    },
    { 
        id: '9a9e-7fb2a1917ea8-402c-4471-b98c3c67', 
        title: 'Aula 3: Carteiras e Segurança', 
        url: 'https://iframe.mediadelivery.net/embed/249011/b98c3c67-402c-4471-9a9e-7fb2a1917ea8?autoplay=false' 
    },
    { 
        id: '4471-9a9e-7fb2a1917ea8-402c-b98c3c67', 
        title: 'Aula 4: Mineração e Halving', 
        url: 'https://iframe.mediadelivery.net/embed/249011/b98c3c67-402c-4471-9a9e-7fb2a1917ea8?autoplay=false' 
    },
    { 
        id: '402c-4471-9a9e-7fb2a1917ea8-b98c3c67', 
        title: 'Aula 5: Lightning Network', 
        url: 'https://iframe.mediadelivery.net/embed/249011/b98c3c67-402c-4471-9a9e-7fb2a1917ea8?autoplay=false' 
    }
];

// Variável global para o player de vídeo
let hodlerVideoPlayer;
let currentVideoIndex = 0;

function init() {
    try {
        console.log('[DEBUG] Iniciando inicialização da cena');
        // Limpa as cenas
        while(scene.children.length > 0) { 
            scene.remove(scene.children[0]); 
        }
        while(cssScene.children.length > 0) {
            cssScene.remove(cssScene.children[0]);
        }

        // Remove TODOS os elementos UI antigos e botões
        document.querySelectorAll('[class*="restricted"], [class*="portal"], .area-button, #restricted-area').forEach(el => el.remove());

        // Adiciona luzes básicas primeiro
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Cria elementos na ordem correta
        console.log('[DEBUG] Criando elementos da cena...');
        createStars();
        lunarTerrain = createLunarTerrain();
        exclusiveLunarTerrain = createExclusiveLunarTerrain();
        
        // Verifica o status do Multiverso Pass antes de definir a visibilidade
        const hasPass = window.hasMultiversoPass === true || window.hasAccess === true;
        console.log('[DEBUG] Inicializando terreno exclusivo. Status do Multiverso Pass:', hasPass);
        console.log('[DEBUG] window.hasMultiversoPass =', window.hasMultiversoPass);
        console.log('[DEBUG] window.hasAccess =', window.hasAccess);
        exclusiveLunarTerrain.visible = hasPass;
        
        spaceship = createSpaceship();
        createStreamScreen();
        
        // Cria o player de vídeo para hodlers e garante a visibilidade correta
        console.log('[DEBUG] Criando player de vídeo para hodlers na inicialização');
        
        // Remove o player existente para garantir uma criação limpa
        if (hodlerVideoPlayer) {
            cssScene.remove(hodlerVideoPlayer);
            hodlerVideoPlayer = null;
        }
        
        // Cria um novo player
        createHodlerVideoPlayer();
        
        // Verifica novamente se o player foi criado e define sua visibilidade
        if (hodlerVideoPlayer) {
            hodlerVideoPlayer.visible = hasPass;
            console.log('[DEBUG] Visibilidade do player definida na inicialização:', hasPass);
        } else {
            console.error('[DEBUG] Falha ao criar o player de vídeo na inicialização');
        }
        
        const earth = createEarth();
        const sun = createSun();
        mysticalPortal = createMysticalPortal();
        createPortalMessage();
        mintButton = createMintButton(); // Armazenar o botão em uma variável global
        
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
        
        // Força uma renderização inicial para garantir que tudo seja exibido corretamente
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
        
        if (cssRenderer && cssScene && camera) {
            cssRenderer.render(cssScene, camera);
            console.log('[DEBUG] Renderização inicial da cena CSS3D');
        }
        
        console.log('[DEBUG] Inicialização da cena concluída com sucesso');
        
        // Agenda uma verificação adicional do player após um curto atraso
        setTimeout(function() {
            if (hasPass) {
                // Verifica se o player existe e está visível
                if (!hodlerVideoPlayer || !hodlerVideoPlayer.visible) {
                    console.log('[DEBUG] Verificação adicional: player não está visível, forçando atualização...');
                    forceUpdateHodlerVideoPlayer();
                } else {
                    console.log('[DEBUG] Verificação adicional: player está visível corretamente');
                }
                
                // Força outra verificação depois de mais um tempo
                setTimeout(function() {
                    // Verifica se temos acesso e se o player está visível
                    if (hasPass && (!hodlerVideoPlayer || !hodlerVideoPlayer.visible)) {
                        console.log('[DEBUG] Segunda verificação: player ainda não visível, forçando atualização final...');
                        forceUpdateHodlerVideoPlayer();
                    }
                }, 2000);
            }
        }, 1000);
        
        // Inicia o loop de animação
        animate();
        
        // Verifica acesso inicial
        // Importante: Usa a função updateExclusiveAccess para garantir consistência
        console.log('[DEBUG] Verificando acesso inicial. Status do Multiverso Pass:', hasPass);
        updateExclusiveAccess(hasPass);
        
    } catch (error) {
        console.error('[DEBUG] Erro durante a inicialização:', error);
    }
}

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
    requestAnimationFrame(animate);
    
    try {
        const delta = clock.getDelta();
        
        // Verifica periodicamente o status do Multiverso Pass (a cada 5 segundos)
        if (!window.lastPassCheck || Date.now() - window.lastPassCheck > 5000) {
            window.lastPassCheck = Date.now();
            checkMultiversoPassStatus();
            
            // Verifica se o player de vídeo está visível quando deveria estar
            const hasPass = window.hasMultiversoPass === true || window.hasAccess === true;
            if (hasPass) {
                if (!hodlerVideoPlayer || !hodlerVideoPlayer.visible) {
                    console.log('[DEBUG] Player não visível quando deveria estar - verificação periódica');
                    
                    if (!hodlerVideoPlayer) {
                        console.log('[DEBUG] Player não existe, criando...');
                        createHodlerVideoPlayer();
                    } else {
                        console.log('[DEBUG] Player existe mas não está visível, corrigindo...');
                        hodlerVideoPlayer.visible = true;
                    }
                    
                    // Se o player não estiver visível mesmo após tentar corrigir, força uma atualização completa
                    setTimeout(function() {
                        if (!hodlerVideoPlayer || !hodlerVideoPlayer.visible) {
                            console.log('[DEBUG] Player ainda não visível, forçando atualização completa');
                            forceUpdateHodlerVideoPlayer();
                            
                            // Garante que a câmera esteja olhando na direção certa
                            if (camera && hodlerVideoPlayer) {
                                // Obtém a posição do player (assumindo que é o primeiro objeto)
                                const playerObj = hodlerVideoPlayer.children[0];
                                if (playerObj) {
                                    console.log('[DEBUG] Ajustando câmera para olhar para o player');
                                    const playerPos = playerObj.position.clone();
                                    // Calcula uma posição a partir da qual olhar para o player
                                    camera.lookAt(playerPos);
                                }
                            }
                        }
                    }, 500);
                }
            } else if (hodlerVideoPlayer) {
                // Se o usuário não tem acesso mas o player está visível, esconde-o
                if (hodlerVideoPlayer.visible) {
                    console.log('[DEBUG] Escondendo player para usuário sem acesso');
                    hodlerVideoPlayer.visible = false;
                }
            }
        }
        
        // Não precisamos mais atualizar o botão Mint, pois ele agora é um elemento HTML fixo
        
        // Atualiza a nave se existir
        if (spaceship && mysticalPortal) {
            // Adiciona rotação contínua da nave
            spaceship.rotation.y = targetRotationY + Math.PI + (Date.now() * 0.0001); // Rotação lenta e contínua

            // Calcula a velocidade base e velocidade com sprint
            const baseSpeed = 4000;
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
            
            // Calcula próxima posição
            const nextPosition = spaceship.position.clone().add(movement);
            
            // Verifica colisões e obtém posição final
            const collisionResult = checkTerrainCollision(nextPosition);
            
            // Atualiza posição da nave se não houver colisão com o stream
            const streamBox = new THREE.Box3().setFromObject(streamScreen);
            const spaceshipBox = new THREE.Box3().setFromObject(spaceship);
            
            if (!streamBox.intersectsBox(spaceshipBox)) {
                spaceship.position.copy(collisionResult.position);
            }
            
            // Atualiza rotação da nave
            spaceship.rotation.y = targetRotationY + Math.PI; // Adiciona PI para manter os propulsores para trás
            
            // Posiciona a câmera atrás da nave com suavização apenas na câmera
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

            // Verifica distância até o portal
            const distanceToPortal = spaceship.position.distanceTo(mysticalPortal.position);
            
            if (distanceToPortal < 2000) {
                // Verifica o status do Multiverso Pass a cada aproximação do portal
                console.log('Próximo ao portal. Status do Multiverso Pass:', window.hasMultiversoPass);
                
                if (!portalMessageElement.style.display || portalMessageElement.style.display === 'none') {
                    // Mostra a mensagem do portal
                    portalMessageElement.style.display = 'block';
                    
                    // Atualiza a mensagem do portal com base no status atual
                    // Usa diretamente a função updateExclusiveAccess para garantir consistência
                    updateExclusiveAccess(window.hasMultiversoPass);
                }

                // Adiciona listener para a tecla E se ainda não existir
                if (!window.portalKeyListener) {
                    window.portalKeyListener = true;
                    
                    // Remove qualquer listener anterior para evitar duplicação
                    window.removeEventListener('keydown', window.portalKeyHandler);
                    
                    // Cria um novo handler e o armazena para poder removê-lo depois
                    window.portalKeyHandler = function(event) {
                        // Verifica novamente o status do Multiverso Pass no momento da tecla
                        if (event.code === 'KeyE') {
                            console.log('Tecla E pressionada. Status do Multiverso Pass:', window.hasMultiversoPass);
                            
                            if (window.hasMultiversoPass === true) {
                                console.log('Atravessando o portal...');
                                const terrainLimit = 7000;
                                
                                // Cria um elemento de fade para transição suave
                                const fadeElement = document.createElement('div');
                                fadeElement.style.position = 'fixed';
                                fadeElement.style.top = '0';
                                fadeElement.style.left = '0';
                                fadeElement.style.width = '100%';
                                fadeElement.style.height = '100%';
                                fadeElement.style.backgroundColor = '#000000';
                                fadeElement.style.opacity = '0';
                                fadeElement.style.transition = 'opacity 1s ease-in-out';
                                fadeElement.style.zIndex = '9999';
                                document.body.appendChild(fadeElement);
                                
                                // Inicia a animação de fade in
                                setTimeout(() => {
                                    fadeElement.style.opacity = '1';
                                }, 50);
                                
                                // Teleporta a nave após o fade in
                                setTimeout(() => {
                                    // Teleporta a nave para logo após o portal
                                    spaceship.position.z = -terrainLimit - 1000; // Apenas 1000 unidades após o portal
                                    camera.position.z = spaceship.position.z + 1200;
                                    
                                    // Esconde a mensagem do portal após atravessar
                                    portalMessageElement.style.display = 'none';
                                    
                                    // Garante que as regras de colisão estejam corretas após o teleporte
                                    updateExclusiveAccess(true);
                                    
                                    // Inicia o fade out
                                    setTimeout(() => {
                                        fadeElement.style.opacity = '0';
                                        
                                        // Remove o elemento após o fade out
                                        setTimeout(() => {
                                            document.body.removeChild(fadeElement);
                                        }, 1000);
                                    }, 500);
                                }, 1000);
                            } else {
                                console.log('Acesso negado: Multiverso Pass não detectado');
                                // Mostra mensagem de acesso negado por mais tempo
                                portalMessageElement.innerHTML = `
                                    <h2 style="color: #ff0000; margin-bottom: 15px;">🚫 Acesso Negado 🚫</h2>
                                    <p>Você precisa do Multiverso Pass para acessar esta área.</p>
                                `;
                            }
                        }
                    };
                    
                    // Adiciona o novo handler
                    window.addEventListener('keydown', window.portalKeyHandler);
                }
            } else {
                if (portalMessageElement.style.display === 'block') {
                    portalMessageElement.style.display = 'none';
                }
            }

            // Adiciona verificação de altura do terreno exclusivo
            if (exclusiveLunarTerrain && exclusiveLunarTerrain.visible) {
                // Verifica se o usuário tem o Multiverso Pass
                if (window.hasMultiversoPass === true) {
                    // Apenas verifica a altura do terreno exclusivo para evitar atravessar o solo
                    raycaster.set(spaceship.position, downVector);
                    const exclusiveIntersects = raycaster.intersectObject(exclusiveLunarTerrain);
                    
                    if (exclusiveIntersects.length > 0) {
                        // Mantém a nave acima do terreno exclusivo
                        const exclusiveHeight = exclusiveIntersects[0].point.y + 400;
                        
                        // Aplica apenas a restrição de altura, sem restrições laterais
                        if (spaceship.position.y < exclusiveHeight) {
                            spaceship.position.y = exclusiveHeight;
                        }
                    }
                } else {
                    // Se o usuário não tem o Multiverso Pass, o terreno exclusivo não deveria estar visível
                    // Mas por segurança, vamos garantir que ele não seja usado
                    exclusiveLunarTerrain.visible = false;
                    console.log('Terreno exclusivo ocultado: usuário sem Multiverso Pass');
                }
            }
        }

        // Renderiza as cenas
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
        if (cssRenderer && cssScene && camera) {
            cssRenderer.render(cssScene, camera);
            
            // Verifica se o player de vídeo está visível a cada quadro quando o usuário tem acesso
            const hasPass = window.hasMultiversoPass === true || window.hasAccess === true;
            if (hasPass && hodlerVideoPlayer && !hodlerVideoPlayer.visible) {
                console.log('[DEBUG] Corrigindo visibilidade do player a cada quadro');
                hodlerVideoPlayer.visible = true;
            }
        }
        
        // Atualiza controles
        if (controls) {
            controls.update(delta);
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
    console.log('[DEBUG] Atualizando acesso exclusivo:', hasAccess);
    
    // Força a conversão para booleano para evitar problemas com valores undefined ou null
    const hasAccessBoolean = hasAccess === true;
    
    // Atualiza a variável global de forma explícita
    window.hasMultiversoPass = hasAccessBoolean;
    window.hasAccess = hasAccessBoolean; // Atualiza também hasAccess para compatibilidade
    
    console.log('[DEBUG] Após atualização: window.hasMultiversoPass =', window.hasMultiversoPass);
    console.log('[DEBUG] Após atualização: window.hasAccess =', window.hasAccess);
    
    // Garante que o terreno exclusivo seja atualizado
    if (exclusiveLunarTerrain) {
        // Atualiza a visibilidade do terreno exclusivo
        exclusiveLunarTerrain.visible = hasAccessBoolean;
        console.log('[DEBUG] Terreno exclusivo visível:', exclusiveLunarTerrain.visible);
        
        // Recria o player se o acesso for concedido ou remove se for revogado
        if (hasAccessBoolean) {
            console.log('[DEBUG] Acesso concedido, recriando o player de vídeo');
            
            // Remove o player existente, se houver
            if (hodlerVideoPlayer) {
                console.log('[DEBUG] Removendo player existente para recriar');
                cssScene.remove(hodlerVideoPlayer);
                hodlerVideoPlayer = null;
            }
            
            // Cria um novo player com um atraso para garantir que tudo esteja inicializado
            setTimeout(() => {
                console.log('[DEBUG] Criando novo player após concessão de acesso');
                createHodlerVideoPlayer();
                
                // Força uma renderização imediata após criar o player
                if (cssRenderer && cssScene && camera) {
                    cssRenderer.render(cssScene, camera);
                    console.log('[DEBUG] Renderização forçada após criar o player');
                }
                
                // Verifica se o player foi criado com sucesso
                if (hodlerVideoPlayer) {
                    console.log('[DEBUG] Player criado com sucesso, visibilidade =', hodlerVideoPlayer.visible);
                } else {
                    console.log('[DEBUG] FALHA ao criar o player!');
                }
            }, 500);
        } else if (hodlerVideoPlayer) {
            // Se o acesso foi revogado e o player existe, oculta-o
            console.log('[DEBUG] Acesso revogado, ocultando player de vídeo');
            console.log('Renderização forçada da cena CSS3D');
        }
    }
}

// Adiciona um evento para forçar a atualização do player após o carregamento completo
window.addEventListener('load', function() {
    console.log('[DEBUG] Página totalmente carregada, verificando player de vídeo');
    // Aguarda um momento para garantir que tudo esteja inicializado
    setTimeout(function() {
        forceUpdateHodlerVideoPlayer();
        
        // Cria um player DOM direto como fallback quando o player 3D não funciona
        createDirectDOMPlayer();
        
        // Adiciona função de diagnóstico que pode ser chamada do console
        window.debugHodlerPlayer = function() {
            console.log('=== DIAGNÓSTICO DO PLAYER DE VÍDEO ===');
            console.log('hasMultiversoPass:', window.hasMultiversoPass);
            console.log('hasAccess:', window.hasAccess);
            console.log('hodlerVideoPlayer existe:', !!hodlerVideoPlayer);
            
            if (hodlerVideoPlayer) {
                console.log('hodlerVideoPlayer visível:', hodlerVideoPlayer.visible);
                console.log('hodlerVideoPlayer posição:', 
                    hodlerVideoPlayer.children[0] ? 
                    JSON.stringify(hodlerVideoPlayer.children[0].position) : 'sem filhos');
                console.log('Número de filhos:', hodlerVideoPlayer.children.length);
                console.log('cssScene contém player:', cssScene.children.includes(hodlerVideoPlayer));
            }
            
            console.log('cssScene número de objetos:', cssScene.children.length);
            console.log('Objetos na cssScene:', cssScene.children.map(c => c.name || 'objeto sem nome').join(', '));
            console.log('CSS Renderer ativo:', !!cssRenderer);
            
            console.log('=== FORÇANDO ATUALIZAÇÃO DO PLAYER ===');
            // Remove player existente
            if (hodlerVideoPlayer) {
                cssScene.remove(hodlerVideoPlayer);
                hodlerVideoPlayer = null;
            }
            
            // Cria novo player com posição fixa e cores intensas
            const fixedPosition = { x: 0, y: 4000, z: -12000 };
            console.log('Criando player na posição:', JSON.stringify(fixedPosition));
            
            createHodlerVideoPlayer();
            
            // Força visibilidade
            if (hodlerVideoPlayer) {
                hodlerVideoPlayer.visible = true;
                console.log('Player recriado e forçado visível');
                
                // Renderiza a cena
                if (cssRenderer && cssScene && camera) {
                    cssRenderer.render(cssScene, camera);
                    console.log('Cena CSS renderizada');
                }
            }
            
            return 'Diagnóstico completo. Verifique o console para mais detalhes.';
        };
        
        // Registra como variável global para fácil acesso
        window.hodlerVideoPlayerRef = hodlerVideoPlayer;
        
        console.log('[INSTRUÇÃO] Para diagnosticar problemas com o player, digite window.debugHodlerPlayer() no console');
    }, 2000);
});

// Função para criar um player DOM direto (como fallback)
function createDirectDOMPlayer() {
    console.log('[DEBUG] Criando player DOM direto como fallback');
    
    // Remove o player anterior se existir
    const existingPlayer = document.getElementById('direct-hodler-player');
    if (existingPlayer) {
        document.body.removeChild(existingPlayer);
    }
    
    // Cria o container principal
    const playerContainer = document.createElement('div');
    playerContainer.id = 'direct-hodler-player';
    playerContainer.style.position = 'fixed';
    playerContainer.style.top = '100px';
    playerContainer.style.right = '20px';
    playerContainer.style.width = '400px';
    playerContainer.style.backgroundColor = '#000000';
    playerContainer.style.border = '5px solid #FF3366';
    playerContainer.style.borderRadius = '10px';
    playerContainer.style.padding = '0';
    playerContainer.style.zIndex = '9999';
    playerContainer.style.boxShadow = '0 0 20px rgba(255, 51, 102, 0.7)';
    playerContainer.style.display = 'none'; // Inicialmente oculto até verificarmos o acesso
    
    // Adiciona cabeçalho
    const header = document.createElement('div');
    header.style.backgroundColor = '#FF3366';
    header.style.color = 'white';
    header.style.padding = '10px';
    header.style.fontWeight = 'bold';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.textContent = '🎓 ÁREA EXCLUSIVA - AULAS BITCOIN 🎓';
    playerContainer.appendChild(header);
    
    // Botão para minimizar/maximizar
    const toggleButton = document.createElement('button');
    toggleButton.textContent = '−';
    toggleButton.style.backgroundColor = 'transparent';
    toggleButton.style.border = 'none';
    toggleButton.style.color = 'white';
    toggleButton.style.fontSize = '20px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.marginLeft = '10px';
    header.appendChild(toggleButton);
    
    // Iframe para o vídeo
    const videoContainer = document.createElement('div');
    videoContainer.style.position = 'relative';
    videoContainer.style.paddingTop = '56.25%'; // 16:9 aspect ratio
    playerContainer.appendChild(videoContainer);
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.src = hodlerVideos[0].url;
    iframe.allow = 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;';
    iframe.allowFullscreen = true;
    videoContainer.appendChild(iframe);
    
    // Selecionar vídeos
    const selectContainer = document.createElement('div');
    selectContainer.style.padding = '10px';
    selectContainer.style.backgroundColor = '#222';
    playerContainer.appendChild(selectContainer);
    
    const selectLabel = document.createElement('label');
    selectLabel.textContent = 'Selecionar aula: ';
    selectLabel.style.color = 'white';
    selectLabel.style.marginRight = '10px';
    selectContainer.appendChild(selectLabel);
    
    const select = document.createElement('select');
    select.style.padding = '5px';
    select.style.borderRadius = '3px';
    select.style.border = '1px solid #555';
    select.style.backgroundColor = '#333';
    select.style.color = 'white';
    selectContainer.appendChild(select);
    
    // Adiciona opções de vídeo
    hodlerVideos.forEach((video, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = video.title;
        select.appendChild(option);
    });
    
    // Evento de mudança para o select
    select.addEventListener('change', function() {
        iframe.src = hodlerVideos[this.value].url;
    });
    
    // Toggle para minimizar/maximizar
    let minimized = false;
    toggleButton.addEventListener('click', function() {
        if (minimized) {
            videoContainer.style.display = 'block';
            selectContainer.style.display = 'block';
            toggleButton.textContent = '−';
            minimized = false;
        } else {
            videoContainer.style.display = 'none';
            selectContainer.style.display = 'none';
            toggleButton.textContent = '+';
            minimized = true;
        }
    });
    
    // Adiciona ao corpo do documento
    document.body.appendChild(playerContainer);
    
    // Função para atualizar a visibilidade com base no acesso
    function updatePlayerVisibility() {
        const hasAccess = window.hasMultiversoPass === true || window.hasAccess === true;
        playerContainer.style.display = hasAccess ? 'block' : 'none';
    }
    
    // Verifica inicialmente e configura verificação periódica
    updatePlayerVisibility();
    setInterval(updatePlayerVisibility, 2000);
    
    // Registra no objeto window para fácil acesso
    window.directPlayerContainer = playerContainer;
    window.updateDirectPlayerVisibility = updatePlayerVisibility;
    
    console.log('[DEBUG] Player DOM direto criado e configurado');
    return playerContainer;
}

// Função para forçar a exibição do player direto
function showDirectPlayer() {
    const playerContainer = document.getElementById('direct-hodler-player');
    if (playerContainer) {
        playerContainer.style.display = 'block';
    } else {
        const newPlayer = createDirectDOMPlayer();
        newPlayer.style.display = 'block';
    }
}

// Adiciona comando global para exibir o player direto
window.showHodlerVideos = function() {
    console.log('[DEBUG] Forçando exibição do player direto');
    showDirectPlayer();
    return "Player de vídeos exclusivos exibido!";
};

// ... existing code ...
function checkMultiversoPassStatus() {
    // Verifica o status do token JWT
    const token = localStorage.getItem('jwt_token');
    let previousAccessStatus = window.hasMultiversoPass;
    
    if (token) {
        try {
            // Decodifica o token para verificar se é válido e se possui o campo necessário
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                const currentTime = Math.floor(Date.now() / 1000);
                
                if (payload.exp && payload.exp > currentTime && payload.multiverso_hodler === true) {
                    window.hasMultiversoPass = true;
                    window.hasAccess = true;
                    console.log('[DEBUG] Multiverso Pass verificado e válido');
                } else {
                    window.hasMultiversoPass = false;
                    console.log('[DEBUG] Token expirado ou não possui acesso de hodler');
                }
            } else {
                window.hasMultiversoPass = false;
                console.log('[DEBUG] Token inválido (formato incorreto)');
            }
        } catch (e) {
            window.hasMultiversoPass = false;
            console.error('[DEBUG] Erro ao processar o token:', e);
        }
    } else {
        window.hasMultiversoPass = false;
        console.log('[DEBUG] Nenhum token encontrado');
    }

    // Se o status de acesso mudou, atualiza o player e o acesso exclusivo
    if (previousAccessStatus !== window.hasMultiversoPass) {
        console.log('[DEBUG] Status de acesso mudou:', previousAccessStatus, '->', window.hasMultiversoPass);
        
        // Força a atualização do player 3D
        forceUpdateHodlerVideoPlayer();
        
        // Atualiza o player DOM direto
        if (window.updateDirectPlayerVisibility) {
            window.updateDirectPlayerVisibility();
        } else {
            // Se a função não existir, cria o player
            createDirectDOMPlayer();
        }
        
        // Atualiza o acesso à área exclusiva
        updateExclusiveAccess(window.hasMultiversoPass);
    }
}
// ... existing code ...

// Função para criar o player de vídeo para hodlers
function createHodlerVideoPlayer() {
    console.log('[DEBUG] Criando player de vídeo para hodlers');
    
    // Remove o player existente se houver
    if (hodlerVideoPlayer) {
        console.log('[DEBUG] Removendo player existente');
        cssScene.remove(hodlerVideoPlayer);
        hodlerVideoPlayer = null;
    }
    
    // Verifica se o usuário tem acesso
    const hasAccess = window.hasMultiversoPass === true || window.hasAccess === true;
    if (!hasAccess) {
        console.log('[DEBUG] Usuário não tem acesso, não criando player');
        return null;
    }
    
    try {
        // Criar grupo para o player
        hodlerVideoPlayer = new THREE.Group();
        hodlerVideoPlayer.name = 'hodlerVideoPlayerGroup';
        
        // Criar elemento DOM para o player
        const playerElement = document.createElement('div');
        playerElement.style.width = HODLER_VIDEO_WIDTH + 'px';
        playerElement.style.height = HODLER_VIDEO_HEIGHT + 'px';
        playerElement.style.backgroundColor = '#000000';
        playerElement.style.border = '20px solid #FF3366';
        playerElement.style.borderRadius = '15px';
        playerElement.style.overflow = 'hidden';
        playerElement.style.pointerEvents = 'auto'; // Importante: permite interação
        
        // Título do player
        const titleElement = document.createElement('div');
        titleElement.textContent = '🎓 ÁREA EXCLUSIVA - AULAS BITCOIN 🎓';
        titleElement.style.backgroundColor = '#FF3366';
        titleElement.style.color = 'white';
        titleElement.style.padding = '15px';
        titleElement.style.fontSize = '24px';
        titleElement.style.fontWeight = 'bold';
        titleElement.style.textAlign = 'center';
        playerElement.appendChild(titleElement);
        
        // Container para o vídeo e controles
        const videoContainer = document.createElement('div');
        videoContainer.style.position = 'relative';
        videoContainer.style.width = '100%';
        videoContainer.style.height = (HODLER_VIDEO_HEIGHT - 54) + 'px';
        playerElement.appendChild(videoContainer);
        
        // Iframe do vídeo
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.src = hodlerVideos[currentVideoIndex].url;
        iframe.allow = 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;';
        iframe.allowFullscreen = true;
        videoContainer.appendChild(iframe);
        
        // Controles de navegação
        const controlsContainer = document.createElement('div');
        controlsContainer.style.display = 'flex';
        controlsContainer.style.justifyContent = 'space-between';
        controlsContainer.style.padding = '10px';
        controlsContainer.style.backgroundColor = '#222';
        playerElement.appendChild(controlsContainer);
        
        // Botão anterior
        const prevButton = document.createElement('button');
        prevButton.textContent = '< Anterior';
        prevButton.style.padding = '5px 10px';
        prevButton.style.backgroundColor = '#FF3366';
        prevButton.style.color = 'white';
        prevButton.style.border = 'none';
        prevButton.style.borderRadius = '5px';
        prevButton.style.cursor = 'pointer';
        prevButton.onclick = function() {
            currentVideoIndex = (currentVideoIndex - 1 + hodlerVideos.length) % hodlerVideos.length;
            iframe.src = hodlerVideos[currentVideoIndex].url;
        };
        controlsContainer.appendChild(prevButton);
        
        // Título do vídeo atual
        const videoTitle = document.createElement('span');
        videoTitle.textContent = hodlerVideos[currentVideoIndex].title;
        videoTitle.style.color = 'white';
        videoTitle.style.padding = '5px';
        controlsContainer.appendChild(videoTitle);
        
        // Botão próximo
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Próximo >';
        nextButton.style.padding = '5px 10px';
        nextButton.style.backgroundColor = '#FF3366';
        nextButton.style.color = 'white';
        nextButton.style.border = 'none';
        nextButton.style.borderRadius = '5px';
        nextButton.style.cursor = 'pointer';
        nextButton.onclick = function() {
            currentVideoIndex = (currentVideoIndex + 1) % hodlerVideos.length;
            iframe.src = hodlerVideos[currentVideoIndex].url;
        };
        controlsContainer.appendChild(nextButton);
        
        // Criar objeto CSS3D
        const playerObject = new CSS3DObject(playerElement);
        
        // Posicionar o player
        playerObject.position.set(HODLER_VIDEO_POSITION.x, HODLER_VIDEO_POSITION.y, HODLER_VIDEO_POSITION.z);
        playerObject.scale.set(1, 1, 1);
        playerObject.name = 'hodlerVideoPlayerObject';
        
        // Adicionar ao grupo
        hodlerVideoPlayer.add(playerObject);
        hodlerVideoPlayer.visible = true;
        
        // Adicionar à cena CSS3D
        cssScene.add(hodlerVideoPlayer);
        
        // Forçar renderização imediata
        if (cssRenderer && camera) {
            cssRenderer.render(cssScene, camera);
            console.log('[DEBUG] Player renderizado na cena CSS3D');
        }
        
        console.log('[DEBUG] Player de vídeo para hodlers criado com sucesso');
        return hodlerVideoPlayer;
    } catch (error) {
        console.error('[ERRO] Falha ao criar player de vídeo para hodlers:', error);
        return null;
    }
}

// ... existing code ...

// Função para forçar a atualização do player de vídeo para hodlers
function forceUpdateHodlerVideoPlayer() {
    console.log('[DEBUG] Forçando atualização do player de vídeo para hodlers');
    
    // Verifica se o usuário tem acesso
    const hasAccess = window.hasMultiversoPass === true || window.hasAccess === true;
    console.log('[DEBUG] Status de acesso:', hasAccess);
    
    // Remove o player existente se houver
    if (hodlerVideoPlayer) {
        console.log('[DEBUG] Removendo player existente para recriar');
        cssScene.remove(hodlerVideoPlayer);
        hodlerVideoPlayer = null;
    }
    
    // Se o usuário tem acesso, cria um novo player
    if (hasAccess) {
        console.log('[DEBUG] Usuário tem acesso, criando novo player');
        
        // Cria o player com um pequeno atraso para garantir que tudo esteja inicializado
        setTimeout(() => {
            createHodlerVideoPlayer();
            
            // Verifica se o player foi criado com sucesso
            if (hodlerVideoPlayer) {
                console.log('[DEBUG] Player criado com sucesso, visibilidade =', hodlerVideoPlayer.visible);
                
                // Força uma renderização imediata
                if (cssRenderer && cssScene && camera) {
                    cssRenderer.render(cssScene, camera);
                    console.log('[DEBUG] Renderização forçada após criar o player');
                }
                
                // Verifica se o player está visível na cena
                const isInScene = cssScene.children.includes(hodlerVideoPlayer);
                console.log('[DEBUG] Player está na cena CSS3D:', isInScene);
                
                // Verifica se o player tem filhos (objetos CSS3D)
                const hasChildren = hodlerVideoPlayer.children.length > 0;
                console.log('[DEBUG] Player tem objetos filhos:', hasChildren);
                
                // Se o player não estiver na cena, adiciona-o
                if (!isInScene) {
                    console.log('[DEBUG] Player não está na cena, adicionando...');
                    cssScene.add(hodlerVideoPlayer);
                    
                    // Força outra renderização
                    if (cssRenderer && cssScene && camera) {
                        cssRenderer.render(cssScene, camera);
                    }
                }
            } else {
                console.log('[DEBUG] FALHA ao criar o player!');
            }
        }, 500);
    } else {
        console.log('[DEBUG] Usuário não tem acesso, não criando player');
    }
}

// ... existing code ...

