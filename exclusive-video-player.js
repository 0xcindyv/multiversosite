/**
 * Módulo para criar um player de vídeo exclusivo usando Three.js e CSS3DRenderer
 * Este módulo fornece uma função para criar um player de vídeo 3D com efeitos visuais
 * para conteúdo exclusivo no Multiverso.
 */

import * as THREE from 'three';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

/**
 * Cria um player de vídeo exclusivo usando CSS3DRenderer
 * @param {Object} options - Opções de configuração
 * @param {THREE.Scene} options.scene - Cena THREE.js para objetos 3D
 * @param {THREE.Scene} options.cssScene - Cena CSS3D para elementos DOM
 * @param {string} options.videoUrl - URL do vídeo a ser exibido
 * @param {Object} options.position - Posição do player {x, y, z}
 * @param {boolean} options.visible - Se o player deve ser visível inicialmente
 * @returns {Object} Referências aos objetos criados
 */
export function createExclusiveVideoPlayer(options) {
    // Valores padrão
    const config = {
        scene: null,
        cssScene: null,
        videoUrl: 'https://iframe.mediadelivery.net/embed/203779/9cc1bfec-5e6a-4a5e-b02f-8d7f6dcc9a4c?autoplay=true&loop=true&muted=false',
        position: { x: 0, y: 1500, z: -10000 },
        visible: true,
        ...options
    };
    
    // Verificar parâmetros obrigatórios
    if (!config.scene || !config.cssScene) {
        console.error('Erro: scene e cssScene são obrigatórios para criar o player de vídeo exclusivo');
        return null;
    }
    
    console.log('🔵 INICIO: Criando player de vídeo exclusivo para hodlers');
    
    try {
        // Limpeza de elementos existentes
        document.querySelectorAll('.exclusive-video-player').forEach(el => el.remove());
        document.querySelectorAll('[id^="exclusive-video-"]').forEach(el => el.remove());
        
        // Remover objetos 3D relacionados ao player anterior
        config.scene.children.forEach(child => {
            if (child.name && (
                child.name.includes('exclusive-video-marker') || 
                child.name.includes('exclusive-video-backup') ||
                child.name.includes('exclusive-video-particles') ||
                child.name.includes('exclusive-video-halo') ||
                child.name.includes('exclusive-video-ambient') ||
                child.name.includes('exclusive-video-light')
            )) {
                config.scene.remove(child);
                console.log('🔵 Removido objeto 3D antigo:', child.name);
            }
        });
        
        // Remover grupos antigos da cena CSS3D
        config.cssScene.children.forEach(child => {
            if (child.name && child.name.includes('exclusive-video-group')) {
                config.cssScene.remove(child);
                console.log('🔵 Removido grupo CSS3D antigo:', child.name);
            }
        });
        
        // Definir dimensões e posicionamento
        const EXCLUSIVE_VIDEO_WIDTH = 900;
        const EXCLUSIVE_VIDEO_HEIGHT = 500;
        
        // Extrair posição
        const { x: playerX, y: playerY, z: playerZ } = config.position;
        
        console.log('🔵 Posicionando player em coordenadas absolutas: X=' + playerX + ', Y=' + playerY + ', Z=' + playerZ);
        
        // Criar elementos DOM para o player (frente)
        const videoElement = document.createElement('div');
        videoElement.className = 'exclusive-video-player';
        videoElement.style.width = EXCLUSIVE_VIDEO_WIDTH + 'px';
        videoElement.style.height = EXCLUSIVE_VIDEO_HEIGHT + 'px';
        videoElement.style.backgroundColor = '#000000';
        videoElement.style.border = '20px solid #FF00FF';
        videoElement.style.borderRadius = '15px';
        videoElement.style.overflow = 'hidden';
        videoElement.style.pointerEvents = 'auto';
        videoElement.style.boxShadow = '0 0 50px #FF00FF, 0 0 100px #FF00FF';
        
        // Título do player exclusivo com animação
        const titleElement = document.createElement('div');
        titleElement.textContent = '✨ CONTEÚDO EXCLUSIVO PARA HODLERS ✨';
        titleElement.style.backgroundColor = '#FF00FF';
        titleElement.style.color = 'white';
        titleElement.style.padding = '15px';
        titleElement.style.fontSize = '24px';
        titleElement.style.fontWeight = 'bold';
        titleElement.style.textAlign = 'center';
        titleElement.style.textShadow = '0 0 10px white';
        
        // Adicionar animação
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
        
        // Iframe do player
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = (EXCLUSIVE_VIDEO_HEIGHT - 54) + 'px';
        iframe.style.border = 'none';
        iframe.src = config.videoUrl;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        
        videoElement.appendChild(iframe);
        
        // Criar elemento DOM para o player (verso)
        const videoElementBack = videoElement.cloneNode(true);
        
        // IDs exclusivos
        const videoId = 'exclusive-video-' + Date.now();
        videoElement.id = videoId + '-front';
        videoElementBack.id = videoId + '-back';
        
        // Adicionar elementos ao DOM
        document.body.appendChild(videoElement);
        document.body.appendChild(videoElementBack);
        
        // Esconder elementos do DOM visível
        videoElement.style.position = 'absolute';
        videoElement.style.left = '-9999px';
        videoElementBack.style.position = 'absolute';
        videoElementBack.style.left = '-9999px';
        
        console.log('🔵 Elementos DOM criados com sucesso:', videoElement.id, videoElementBack.id);
        
        // Criar grupo para conter os dois lados do player
        const videoGroup = new THREE.Group();
        videoGroup.name = 'exclusive-video-group-' + Date.now();
        
        // Criar objeto CSS3D para frente
        const videoObject = new CSS3DObject(videoElement);
        videoObject.position.set(playerX, playerY, playerZ);
        videoObject.scale.set(3, 3, 3);
        
        // Criar objeto CSS3D para verso
        const videoObjectBack = new CSS3DObject(videoElementBack);
        videoObjectBack.position.set(playerX, playerY, playerZ - 1);
        videoObjectBack.scale.set(3, 3, 3);
        videoObjectBack.rotation.y = Math.PI;
        
        // Adicionar objetos ao grupo
        videoGroup.add(videoObject);
        videoGroup.add(videoObjectBack);
        
        // Definir visibilidade
        videoGroup.visible = config.visible;
        
        // Adicionar à cena CSS3D
        config.cssScene.add(videoGroup);
        
        console.log('🔵 Player CSS3D adicionado à cena. Group ID:', videoGroup.id, 'Group Name:', videoGroup.name);
        
        // Criar marcador visual acima do player
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
        marker.visible = config.visible;
        config.scene.add(marker);
        
        // Criar plano de backup
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
        plane.visible = config.visible;
        config.scene.add(plane);
        
        // Adicionar luzes
        const spotLight1 = new THREE.SpotLight(0xFF00FF, 30);
        spotLight1.position.set(playerX - 200, playerY + 500, playerZ - 200);
        spotLight1.target.position.set(playerX, playerY, playerZ);
        spotLight1.angle = Math.PI / 2;
        spotLight1.penumbra = 0.2;
        spotLight1.distance = 10000;
        spotLight1.name = 'exclusive-video-light-1';
        spotLight1.visible = config.visible;
        config.scene.add(spotLight1);
        config.scene.add(spotLight1.target);
        
        const spotLight2 = new THREE.SpotLight(0xFF00FF, 30);
        spotLight2.position.set(playerX + 200, playerY + 500, playerZ - 200);
        spotLight2.target.position.set(playerX, playerY, playerZ);
        spotLight2.angle = Math.PI / 2;
        spotLight2.penumbra = 0.2;
        spotLight2.distance = 10000;
        spotLight2.name = 'exclusive-video-light-2';
        spotLight2.visible = config.visible;
        config.scene.add(spotLight2);
        config.scene.add(spotLight2.target);
        
        // Adicionar luz ambiente
        const ambientLight = new THREE.AmbientLight(0xFF00FF, 2);
        ambientLight.position.set(playerX, playerY, playerZ);
        ambientLight.name = 'exclusive-video-ambient';
        ambientLight.visible = config.visible;
        config.scene.add(ambientLight);
        
        // Criar partículas
        const particleCount = 2000;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        // Distribuir partículas em uma esfera
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
        particles.visible = config.visible;
        config.scene.add(particles);
        
        // Adicionar halo
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
        halo.visible = config.visible;
        config.scene.add(halo);
        
        // Animar elementos visuais
        function animateElements() {
            const animationId = requestAnimationFrame(animateElements);
            const time = Date.now() * 0.001;
            
            // Animar marcador
            if (marker) {
                marker.position.y = playerY + 500 + Math.sin(time) * 200;
                marker.scale.setScalar(1 + Math.sin(time * 0.5) * 0.7);
            }
            
            // Animar halo
            if (halo) {
                halo.scale.set(
                    1 + Math.sin(time * 0.7) * 0.5,
                    1 + Math.sin(time * 0.7) * 0.5,
                    1
                );
                halo.rotation.z = time * 0.5;
                haloMaterial.opacity = 0.5 + Math.sin(time) * 0.5;
            }
            
            // Animar partículas
            if (particles && particles.geometry.attributes.position) {
                const positions = particles.geometry.attributes.position.array;
                for (let i = 0; i < particleCount; i++) {
                    positions[i * 3] += Math.sin(time + i * 0.01) * 2;
                    positions[i * 3 + 1] += Math.cos(time + i * 0.01) * 2;
                    positions[i * 3 + 2] += Math.sin(time * 0.5 + i * 0.01) * 2;
                    
                    // Reposicionar partículas que saem muito do limite
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
            
            // Armazenar ID da animação
            videoGroup.userData.animationId = animationId;
        }
        
        // Iniciar animações
        animateElements();
        
        console.log('🔵 Player exclusivo criado com sucesso. Iniciando animações.');
        
        // Retornar referências
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
            position: { x: playerX, y: playerY, z: playerZ },
            domElements: { front: videoElement, back: videoElementBack },
            
            // Método para definir visibilidade
            setVisible: function(visible) {
                videoGroup.visible = visible;
                marker.visible = visible;
                particles.visible = visible;
                halo.visible = visible;
                plane.visible = visible;
                ambientLight.visible = visible;
                spotLight1.visible = visible;
                spotLight2.visible = visible;
                
                console.log('🔵 Visibilidade do player exclusivo definida como:', visible ? 'VISÍVEL' : 'INVISÍVEL');
                
                return this;
            },
            
            // Método para destruir o player
            destroy: function() {
                // Cancelar animação
                if (videoGroup.userData.animationId) {
                    cancelAnimationFrame(videoGroup.userData.animationId);
                }
                
                // Remover elementos DOM
                if (videoElement.parentNode) {
                    videoElement.parentNode.removeChild(videoElement);
                }
                
                if (videoElementBack.parentNode) {
                    videoElementBack.parentNode.removeChild(videoElementBack);
                }
                
                // Remover objetos da cena
                config.cssScene.remove(videoGroup);
                config.scene.remove(marker);
                config.scene.remove(particles);
                config.scene.remove(halo);
                config.scene.remove(plane);
                config.scene.remove(ambientLight);
                config.scene.remove(spotLight1);
                config.scene.remove(spotLight1.target);
                config.scene.remove(spotLight2);
                config.scene.remove(spotLight2.target);
                
                console.log('🔵 Player exclusivo destruído com sucesso');
            }
        };
    } catch (error) {
        console.error('🔴 ERRO ao criar player exclusivo:', error);
        
        // Criar marcador de emergência em caso de erro
        const emergencyMarker = new THREE.Mesh(
            new THREE.SphereGeometry(500, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xFF0000, transparent: true, opacity: 0.8 })
        );
        emergencyMarker.position.set(config.position.x, config.position.y, config.position.z);
        emergencyMarker.name = 'emergency-marker';
        config.scene.add(emergencyMarker);
        
        return {
            marker: emergencyMarker,
            position: config.position,
            
            // Método para definir visibilidade
            setVisible: function(visible) {
                emergencyMarker.visible = visible;
                return this;
            },
            
            // Método para destruir o player
            destroy: function() {
                config.scene.remove(emergencyMarker);
            }
        };
    }
} 