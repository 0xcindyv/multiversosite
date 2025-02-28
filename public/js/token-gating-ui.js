import { verificarTokenGating, getVerificationStatus, isAuthenticated, updateVerificationStatus } from './xverse-token-gating.js';

// Estados para controlar a interface
let isModalOpen = false;
let isVerifying = false;
let gatedContent = null;

// Elementos globais
let buttonElement = null;
let errorElement = null;
let callbacks = {
    onSuccess: null,
    onError: null
};

// Language support
const modalTexts = {
    PT: {
        title: "Verificação de Ordinals",
        description: "Conecte sua carteira Xverse para verificar se você possui um Ordinal da coleção.",
        verifyButton: "Verificar Agora",
        continueButton: "Continuar",
        tryAgainButton: "Tentar Novamente",
        successTitle: "✓ Verificado com sucesso!",
        successMessage: "Você possui um Ordinal válido da coleção.",
        successId: "ID:",
        errorTitle: "⚠️ Verificação falhou",
        noOrdinalMessage: "Você não possui nenhum Ordinal da coleção necessária.",
        verificationError: "Erro na verificação. Tente novamente.",
        installXverse: "Por favor instale a extensão Xverse"
    },
    EN: {
        title: "Ordinals Verification",
        description: "Connect your Xverse wallet to verify if you own an Ordinal from the collection.",
        verifyButton: "Verify Now",
        continueButton: "Continue",
        tryAgainButton: "Try Again",
        successTitle: "✓ Successfully verified!",
        successMessage: "You have a valid Ordinal from the collection.",
        successId: "ID:",
        errorTitle: "⚠️ Verification failed",
        noOrdinalMessage: "You don't have any Ordinal from the required collection.",
        verificationError: "Verification error. Please try again.",
        installXverse: "Please install the Xverse extension"
    }
};

// Get current language from window object (set in main.js)
function getCurrentLanguage() {
    return window.currentLanguage || 'PT';
}

/**
 * Inicializa o token gating UI
 * @param {Object} config - Configurações
 * @param {Function} config.onSuccess - Callback quando o usuário é autenticado com sucesso
 * @param {Function} config.onError - Callback quando ocorre um erro
 * @param {HTMLElement} config.gatedContentElement - Elemento que contém o conteúdo protegido
 */
export function initTokenGatingUI(options = {}) {
    console.log('Iniciando token-gating-ui com opções:', options);
    
    // Verificar se o SatsConnect está disponível
    if (typeof window.SatsConnect === 'undefined') {
        console.warn('SatsConnect não está disponível no momento da inicialização. Aguardando carregamento...');
        
        // Tentar novamente após 1 segundo
        setTimeout(() => {
            if (typeof window.SatsConnect !== 'undefined') {
                console.log('SatsConnect detectado após espera:', window.SatsConnect);
                setupTokenGatingUI(options);
            } else {
                console.error('SatsConnect não foi encontrado mesmo após aguardar. Verifique se a extensão Xverse está instalada.');
                
                // Criar um botão de alerta se não houver extensão
                const lang = getCurrentLanguage();
                createErrorButton(modalTexts[lang].installXverse);
            }
        }, 1000);
    } else {
        console.log('SatsConnect disponível na inicialização:', window.SatsConnect);
        setupTokenGatingUI(options);
    }
}

/**
 * Inicializa a interface
 */
function setupTokenGatingUI(options) {
    console.log('Configurando token gating UI');
    
    // Armazenar referências para os elementos e callbacks
    gatedContent = options.gatedContentElement || document.getElementById('gated-content');
    errorElement = document.getElementById('error');
    
    // Armazenar callbacks
    callbacks.onSuccess = options.onSuccess || function() {};
    callbacks.onError = options.onError || function() {};
    
    // Mostrar o estado inicial
    updateUIState();
    
    // Criar botão de conexão
    createConnectButton();
}

/**
 * Cria o botão de conexão da carteira
 */
function createConnectButton() {
    console.log('Criando botão de conexão da carteira');
    
    // Remover botão existente se houver
    if (buttonElement) {
        console.log('Removendo botão existente');
        buttonElement.remove();
    }
    
    // Criar novo botão
    buttonElement = document.createElement('button');
    buttonElement.id = 'wallet-connect-btn';
    buttonElement.className = 'wallet-btn';
    buttonElement.textContent = 'Conectar Carteira';
    
    // Adicionar estilos explícitos para garantir visibilidade
    buttonElement.style.position = 'fixed';
    buttonElement.style.top = '20px';
    buttonElement.style.right = '20px';
    buttonElement.style.padding = '10px 20px';
    buttonElement.style.backgroundColor = '#ff6600';
    buttonElement.style.color = 'white';
    buttonElement.style.border = 'none';
    buttonElement.style.borderRadius = '5px';
    buttonElement.style.cursor = 'pointer';
    buttonElement.style.zIndex = '1000';
    buttonElement.style.fontWeight = 'bold';
    buttonElement.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    buttonElement.style.transition = 'background-color 0.3s ease';
    buttonElement.style.fontSize = '16px';
    buttonElement.style.display = 'block';
    
    // Adicionar efeitos de hover
    buttonElement.onmouseover = () => {
        buttonElement.style.backgroundColor = '#ff8533';
    };
    buttonElement.onmouseout = () => {
        buttonElement.style.backgroundColor = '#ff6600';
    };
    
    // Adicionar evento de clique
    buttonElement.addEventListener('click', async () => {
        console.log('Botão de conexão clicado');
        
        if (typeof window.SatsConnect === 'undefined') {
            showError('Extensão Xverse não detectada. Por favor, instale a extensão Xverse para continuar.');
            console.error('SatsConnect não está disponível no click do botão');
            return;
        }
        
        console.log('SatsConnect disponível no click:', window.SatsConnect);
        
        try {
            // Desabilitar botão durante a verificação
            buttonElement.disabled = true;
            buttonElement.textContent = 'Conectando...';
            
            // Verificar token gating
            await verificarTokenGating();
            
            // Verificar resultado da autenticação
            const status = getVerificationStatus();
            console.log('Status após verificação:', status);
            
            if (isAuthenticated()) {
                console.log('Autenticação bem-sucedida');
                buttonElement.textContent = 'Carteira Conectada ✓';
                buttonElement.style.backgroundColor = '#4CAF50';
                
                // Mostrar conteúdo exclusivo
                if (gatedContent) {
                    gatedContent.style.display = 'block';
                }
                
                // Chamar callback de sucesso
                if (callbacks.onSuccess) {
                    callbacks.onSuccess(status);
                }
            } else {
                console.log('Autenticação falhou');
                buttonElement.textContent = 'Conectar Carteira';
                buttonElement.disabled = false;
                
                // Mostrar erro se houver
                if (status.error) {
                    showError(status.error);
                }
                
                // Chamar callback de erro
                if (callbacks.onError) {
                    callbacks.onError(status.error || 'Falha na autenticação');
                }
            }
        } catch (error) {
            console.error('Erro ao verificar token gating:', error);
            
            // Restaurar botão
            buttonElement.textContent = 'Conectar Carteira';
            buttonElement.disabled = false;
            
            // Mostrar erro
            showError(error.message || 'Erro ao conectar carteira');
            
            // Chamar callback de erro
            if (callbacks.onError) {
                callbacks.onError(error);
            }
        }
    });
    
    // Adicionar botão ao documento
    document.body.appendChild(buttonElement);
    
    // Verificar se o botão foi adicionado corretamente
    setTimeout(() => {
        const addedButton = document.getElementById('wallet-connect-btn');
        console.log('Botão adicionado ao DOM:', addedButton ? 'Sim' : 'Não');
        if (addedButton) {
            console.log('Propriedades do botão:', {
                display: window.getComputedStyle(addedButton).display,
                visibility: window.getComputedStyle(addedButton).visibility,
                position: window.getComputedStyle(addedButton).position,
                zIndex: window.getComputedStyle(addedButton).zIndex
            });
        }
    }, 100);
}

// Criar botão de erro quando a extensão não está instalada
function createErrorButton(message) {
    console.log('Criando botão de erro:', message);
    
    // Remover botão existente se houver
    if (buttonElement) {
        buttonElement.remove();
    }
    
    // Criar novo botão
    buttonElement = document.createElement('button');
    buttonElement.id = 'wallet-error-btn';
    buttonElement.className = 'wallet-btn';
    buttonElement.textContent = 'Instalar Xverse';
    
    // Estilizar o botão
    buttonElement.style.position = 'fixed';
    buttonElement.style.top = '20px';
    buttonElement.style.right = '20px';
    buttonElement.style.padding = '10px 20px';
    buttonElement.style.backgroundColor = '#ff3333';
    buttonElement.style.color = 'white';
    buttonElement.style.border = 'none';
    buttonElement.style.borderRadius = '5px';
    buttonElement.style.cursor = 'pointer';
    buttonElement.style.zIndex = '1000';
    buttonElement.style.fontWeight = 'bold';
    buttonElement.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    
    // Adicionar evento de clique para abrir o site da Xverse
    buttonElement.addEventListener('click', () => {
        window.open('https://www.xverse.app/download', '_blank');
    });
    
    // Adicionar botão ao documento
    document.body.appendChild(buttonElement);
    
    // Mostrar mensagem de erro
    showError(message);
}

// Função para mostrar erro
function showError(message) {
    console.error('Erro de token gating:', message);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Esconder após 5 segundos
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

// Atualiza o estado da UI com base no status de autenticação
function updateUIState() {
    console.log('Atualizando estado da UI');
    
    const status = getVerificationStatus();
    console.log('Status atual:', status);
    
    if (isAuthenticated()) {
        // Usuário está autenticado
        if (buttonElement) {
            buttonElement.textContent = 'Carteira Conectada ✓';
            buttonElement.disabled = true;
            buttonElement.style.backgroundColor = '#4CAF50';
        }
        
        // Mostrar conteúdo exclusivo
        if (gatedContent) {
            gatedContent.style.display = 'block';
        }
    } else {
        // Usuário não autenticado
        if (buttonElement) {
            buttonElement.textContent = 'Conectar Carteira';
            buttonElement.disabled = false;
        }
        
        // Esconder conteúdo exclusivo
        if (gatedContent) {
            gatedContent.style.display = 'none';
        }
    }
}

/**
 * Cria o modal de verificação
 */
function createVerificationModal() {
  const modal = document.createElement('div');
  modal.id = 'verification-modal';
  modal.className = 'modal';
  
  // Estilo do modal
  modal.style.display = 'none';
  modal.style.position = 'fixed';
  modal.style.zIndex = '2000';
  modal.style.left = '0';
  modal.style.top = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  
  // Get current language
  const lang = getCurrentLanguage();
  const texts = modalTexts[lang];
  
  // Conteúdo do modal
  modal.innerHTML = `
    <div class="modal-content" style="background-color: #1a1a1a; color: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%; margin: 0 auto; position: relative; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);">
      <span class="close-btn" style="position: absolute; top: 10px; right: 15px; font-size: 24px; cursor: pointer; color: #999;">&times;</span>
      <h2 style="text-align: center; margin-top: 0; color: #ff6600;">${texts.title}</h2>
      <p style="text-align: center; margin-bottom: 20px;">${texts.description}</p>
      
      <div id="verification-status" style="display: none; padding: 10px; margin: 10px 0; border-radius: 5px;"></div>
      
      <button id="verify-btn" style="display: block; width: 100%; padding: 12px; background-color: #ff6600; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-top: 20px;">${texts.verifyButton}</button>
      
      <div id="loading-indicator" style="display: none; text-align: center; margin: 20px 0;">
        <div style="display: inline-block; width: 30px; height: 30px; border: 3px solid rgba(255, 255, 255, .3); border-radius: 50%; border-top-color: #ff6600; animation: spin 1s ease-in-out infinite;"></div>
      </div>
      
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Adicionar event listeners
  const closeBtn = modal.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeVerificationModal);
  }
  
  const verifyBtn = modal.querySelector('#verify-btn');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', startVerification);
  }
  
  // Fechar modal ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeVerificationModal();
    }
  });
  
  return modal;
}

/**
 * Abre o modal de verificação
 */
function openVerificationModal() {
  const modal = document.getElementById('verification-modal');
  if (!modal) return;
  
  modal.style.display = 'flex';
  isModalOpen = true;
  
  resetVerificationStatus();
}

/**
 * Fecha o modal de verificação
 */
function closeVerificationModal() {
  const modal = document.getElementById('verification-modal');
  if (!modal) return;
  
  modal.style.display = 'none';
  isModalOpen = false;
}

/**
 * Reseta o status de verificação no modal
 */
function resetVerificationStatus() {
  const statusElement = document.getElementById('verification-status');
  const loadingIndicator = document.getElementById('loading-indicator');
  const verifyBtn = document.getElementById('verify-btn');
  
  if (statusElement) statusElement.style.display = 'none';
  if (loadingIndicator) loadingIndicator.style.display = 'none';
  if (verifyBtn) {
    verifyBtn.style.display = 'block';
    verifyBtn.textContent = 'Verificar Agora';
  }
}

/**
 * Inicia o processo de verificação
 */
async function startVerification() {
  if (isVerifying) return;
  
  isVerifying = true;
  
  const statusElement = document.getElementById('verification-status');
  const loadingIndicator = document.getElementById('loading-indicator');
  const verifyBtn = document.getElementById('verify-btn');
  
  if (statusElement) statusElement.style.display = 'none';
  if (loadingIndicator) loadingIndicator.style.display = 'block';
  if (verifyBtn) {
    verifyBtn.style.display = 'none';
  }
  
  try {
    const isValid = await verificarTokenGating();
    const status = getVerificationStatus();
    
    if (isValid && status.hasValidOrdinal) {
      showSuccessMessage(status);
      saveAuthenticationState(true);
      updateButtonState();
      showGatedContent();
    } else {
      // Get current language
      const lang = getCurrentLanguage();
      const texts = modalTexts[lang];
      showErrorMessage(status.error || texts.noOrdinalMessage);
      saveAuthenticationState(false);
    }
  } catch (error) {
    // Get current language
    const lang = getCurrentLanguage();
    const texts = modalTexts[lang];
    showErrorMessage(error.message || texts.verificationError);
    saveAuthenticationState(false);
  } finally {
    isVerifying = false;
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (verifyBtn) verifyBtn.style.display = 'block';
  }
}

/**
 * Exibe mensagem de sucesso
 */
function showSuccessMessage(status) {
  const statusElement = document.getElementById('verification-status');
  if (!statusElement) return;
  
  // Get current language
  const lang = getCurrentLanguage();
  const texts = modalTexts[lang];
  
  statusElement.style.display = 'block';
  statusElement.style.backgroundColor = '#4CAF50';
  statusElement.style.color = 'white';
  statusElement.innerHTML = `
    <p><strong>${texts.successTitle}</strong></p>
    <p>${texts.successMessage}</p>
    <p><small>${texts.successId} ${status.ordinalFound}</small></p>
  `;
  
  // Botão para fechar o modal após sucesso
  const verifyBtn = document.getElementById('verify-btn');
  if (verifyBtn) {
    verifyBtn.textContent = texts.continueButton;
    verifyBtn.style.backgroundColor = '#4CAF50';
    verifyBtn.removeEventListener('click', startVerification);
    verifyBtn.addEventListener('click', closeVerificationModal);
  }
}

/**
 * Exibe mensagem de erro
 */
function showErrorMessage(message) {
  const statusElement = document.getElementById('verification-status');
  if (!statusElement) return;
  
  // Get current language
  const lang = getCurrentLanguage();
  const texts = modalTexts[lang];
  
  statusElement.style.display = 'block';
  statusElement.style.backgroundColor = '#f44336';
  statusElement.style.color = 'white';
  statusElement.innerHTML = `
    <p><strong>${texts.errorTitle}</strong></p>
    <p>${message}</p>
  `;
  
  // Atualizar botão para tentar novamente
  const verifyBtn = document.getElementById('verify-btn');
  if (verifyBtn) {
    verifyBtn.textContent = texts.tryAgainButton;
  }
}

/**
 * Exibe o conteúdo protegido
 */
function showGatedContent() {
  if (gatedContent) {
    gatedContent.style.display = 'block';
  }
}

/**
 * Criptografa dados sensíveis antes de armazenar
 * @param {Object} data - Dados a serem criptografados
 * @returns {string} - Dados criptografados
 */
function encryptData(data) {
  try {
    // Criar uma chave simples baseada no user agent e data
    const simpleKey = navigator.userAgent.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 256;
    
    // Converter dados para string JSON
    const jsonData = JSON.stringify(data);
    
    // Criptografia simples (XOR com a chave)
    const encrypted = Array.from(jsonData).map(char => {
      return String.fromCharCode(char.charCodeAt(0) ^ simpleKey);
    }).join('');
    
    // Codificar em base64 para armazenamento seguro
    return btoa(encrypted);
  } catch (error) {
    console.error('Erro ao criptografar dados:', error);
    return JSON.stringify(data); // Fallback para JSON normal
  }
}

/**
 * Descriptografa dados do armazenamento
 * @param {string} encryptedData - Dados criptografados
 * @returns {Object|null} - Dados descriptografados ou null se falhar
 */
function decryptData(encryptedData) {
  try {
    // Criar a mesma chave simples
    const simpleKey = navigator.userAgent.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 256;
    
    // Decodificar base64
    const decoded = atob(encryptedData);
    
    // Descriptografar (XOR com a mesma chave)
    const decrypted = Array.from(decoded).map(char => {
      return String.fromCharCode(char.charCodeAt(0) ^ simpleKey);
    }).join('');
    
    // Converter de volta para objeto
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error);
    try {
      // Tentar interpretar como JSON normal (para compatibilidade)
      return JSON.parse(encryptedData);
    } catch (e) {
      console.error('Falha ao processar dados armazenados:', e);
      return null;
    }
  }
}

/**
 * Salva o estado da autenticação no localStorage
 */
function saveAuthenticationState(isAuth) {
  try {
    if (isAuth) {
      const status = getVerificationStatus();
      const authData = {
        authenticated: true,
        timestamp: Date.now(),
        ordinalId: status.ordinalFound
      };
      
      // Criptografar dados antes de armazenar
      const encryptedData = encryptData(authData);
      localStorage.setItem('ordinal_auth', encryptedData);
    } else {
      localStorage.removeItem('ordinal_auth');
    }
  } catch (error) {
    console.error('Erro ao salvar estado de autenticação:', error);
  }
}

/**
 * Verifica se há uma autenticação prévia válida
 */
function checkPreviousAuthentication() {
  try {
    const storedAuth = localStorage.getItem('ordinal_auth');
    if (!storedAuth) return;
    
    // Descriptografar dados armazenados
    const authData = decryptData(storedAuth);
    if (!authData) return;
    
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Verificar se a autenticação não expirou (24 horas)
    if (authData.authenticated && authData.timestamp && (now - authData.timestamp < oneDayMs)) {
      // Atualizar o estado como autenticado usando a função exportada
      updateVerificationStatus({
        connected: true,
        hasValidOrdinal: true,
        ordinalFound: authData.ordinalId,
        error: null
      });
      
      // Mostrar o conteúdo protegido
      if (gatedContent) {
        gatedContent.style.display = 'block';
      }
    } else {
      // Autenticação expirada
      localStorage.removeItem('ordinal_auth');
    }
  } catch (error) {
    console.error('Erro ao verificar autenticação prévia:', error);
    // Em caso de erro, remover dados potencialmente corrompidos
    localStorage.removeItem('ordinal_auth');
  }
} 