/**
 * @file Orquestrador principal da aplicação frontend (eventos de DOM + integração Socket.IO).
 */

import { state, addLocalQuestion, toggleVoteQuestion } from './state.js';
import { createSocketClient } from './socketService.js';
import {
  formatTimeHHMM,
  showToast,
  renderConnectionBadge,
  renderRoomsBar,
  renderRoomHeaderAndPlayer,
  renderChatMessages,
  renderQuestionsPanel,
} from './ui.js';

// Inicializa o cliente Socket.IO respeitando o contrato do backend
const socketClient = createSocketClient({
  onConnect(socketId) {
    state.connectionStatus = 'connected';
    state.socketId = socketId;
    renderConnectionBadge();
    renderRoomHeaderAndPlayer();

    // Requisito: No evento `connect`, reenviar `entrar_sala` automaticamente
    // se o usuário já tiver entrado em uma sala antes.
    if (state.joinedRoom && state.username) {
      socketClient.emitEntrarSala(state.joinedRoom, state.username);
      showToast(`Reconectado à sala ${state.joinedRoom} como ${state.username}.`, 'info');
    }
  },

  onDisconnect() {
    state.connectionStatus = 'disconnected';
    renderConnectionBadge();
    renderRoomHeaderAndPlayer();
  },

  onConnectError() {
    state.connectionStatus = 'error';
    renderConnectionBadge();
    renderRoomHeaderAndPlayer();
  },

  onMensagem(payload) {
    if (!payload || typeof payload.text !== 'string') return;
    state.messages.push({
      type: 'mensagem',
      payload,
    });
    renderChatMessages();
  },

  onAviso(payload) {
    if (!payload || typeof payload.text !== 'string') return;
    state.messages.push({
      type: 'aviso',
      payload,
    });
    renderChatMessages();
  },

  onErro(payload) {
    const message =
      payload && typeof payload.message === 'string'
        ? payload.message
        : 'Ocorreu um erro ao processar sua solicitação.';
    showToast(message, 'error');
  },
});

/**
 * Entra ou troca para a sala selecionada caso o usuário já tenha fornecido seu nome.
 * @param {string} targetRoomId
 */
function joinOrSwitchRoom(targetRoomId) {
  const usernameInput = /** @type {HTMLInputElement | null} */ (
    document.getElementById('username-input')
  );
  const candidateName = (usernameInput ? usernameInput.value : state.username).trim().slice(0, 30);

  const previousJoinedRoom = state.joinedRoom;
  state.selectedRoom = targetRoomId;

  if (!candidateName) {
    // Usuário apenas trocou a aba de visualização da aula antes de entrar com nome
    renderAll();
    showToast(`Aula ${targetRoomId} selecionada. Digite seu nome e clique em Entrar.`, 'info');
    if (usernameInput) usernameInput.focus();
    return;
  }

  if (state.connectionStatus !== 'connected') {
    showToast('Servidor Socket.IO desconectado. Verifique se http://localhost:3000 está rodando.', 'error');
    renderAll();
    return;
  }

  state.username = candidateName;
  if (usernameInput) usernameInput.value = candidateName;

  // Se trocou de sala, limpa o histórico visual do chat da sala anterior
  if (previousJoinedRoom !== targetRoomId) {
    state.messages = [];
  }

  state.joinedRoom = targetRoomId;
  socketClient.emitEntrarSala(targetRoomId, candidateName);

  // Adiciona aviso local imediato para o próprio aluno saber que entrou
  state.messages.push({
    type: 'aviso',
    payload: {
      text: `Você entrou na sala ${targetRoomId} como ${candidateName}.`,
      createdAt: new Date().toISOString(),
    },
  });

  renderAll();
}

/**
 * Trata o voto em uma dúvida da sala atual e reordena automaticamente.
 * @param {string} questionId
 */
function handleVoteQuestion(questionId) {
  toggleVoteQuestion(state.selectedRoom, questionId);
  renderQuestionsPanel(handleVoteQuestion);
}

/**
 * Renderiza toda a interface de forma sincronizada.
 */
function renderAll() {
  renderConnectionBadge();
  renderRoomsBar((roomId) => joinOrSwitchRoom(roomId));
  renderRoomHeaderAndPlayer();
  renderChatMessages();
  renderQuestionsPanel(handleVoteQuestion);
}

// Configura listeners de formulário e controles do player simulado
function setupDomListeners() {
  const joinForm = document.getElementById('join-form');
  const chatForm = document.getElementById('chat-form');
  const chatInput = /** @type {HTMLInputElement | null} */ (document.getElementById('chat-input'));
  const charCounter = document.getElementById('char-counter');
  const questionCheckbox = /** @type {HTMLInputElement | null} */ (
    document.getElementById('question-checkbox')
  );

  if (joinForm) {
    joinForm.addEventListener('submit', (event) => {
      event.preventDefault();
      joinOrSwitchRoom(state.selectedRoom);
    });
  }

  if (chatInput && charCounter) {
    chatInput.addEventListener('input', () => {
      charCounter.textContent = `${chatInput.value.length}/500`;
    });
  }

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const rawText = chatInput.value;
      const cleanText = rawText.trim().slice(0, 500);

      if (!cleanText) return;

      // Envia a mensagem para o servidor Socket.IO (payload string simples)
      socketClient.emitMensagem(cleanText);

      // Se o checkbox "Marcar como dúvida" estiver marcado, adiciona também ao estado local da sala
      if (questionCheckbox && questionCheckbox.checked) {
        const author = state.username || 'Aluno';
        const nowFormatted = formatTimeHHMM(new Date().toISOString());
        addLocalQuestion(state.selectedRoom, author, cleanText, nowFormatted);
        questionCheckbox.checked = false;
        renderQuestionsPanel(handleVoteQuestion);
        showToast('Sua pergunta foi adicionada ao painel "Dúvidas da Aula"!', 'success');
      }

      chatInput.value = '';
      if (charCounter) charCounter.textContent = '0/500';
      chatInput.focus();
    });
  }

  // Controles visuais simulados do player de vídeo
  const playBtn = document.getElementById('player-play-btn');
  const playLabel = document.getElementById('player-play-label');
  let isPlaying = true;
  if (playBtn && playLabel) {
    playBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      playLabel.textContent = isPlaying ? '⏸ Pausar' : '▶ Reproduzir';
    });
  }

  const muteBtn = document.getElementById('player-mute-btn');
  let isMuted = false;
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      muteBtn.textContent = isMuted ? '🔇 Mudo' : '🔊 100%';
    });
  }

  const fullscreenBtn = document.getElementById('player-fullscreen-btn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      const playerCard = fullscreenBtn.closest('.aspect-video');
      if (!playerCard) return;
      if (!document.fullscreenElement && playerCard.requestFullscreen) {
        playerCard.requestFullscreen().catch(() => {});
      } else if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    });
  }
}

setupDomListeners();
renderAll();
