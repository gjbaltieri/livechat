/**
 * @file Orquestrador principal do frontend AulaLive (fluxo em 2 telas + integração Socket.IO).
 */

import { ROOMS_CONFIG, state } from './state.js';
import { createSocketClient } from './socketService.js';
import {
  showToast,
  renderConnectionStatus,
  renderLobbyCards,
  renderScreenVisibility,
  renderClassroomDetails,
  stopYoutubePlayer,
  renderActiveTab,
  renderChatMessages,
  renderQuestionsTab,
} from './ui.js';

const socketClient = createSocketClient({
  onConnect(socketId) {
    state.connectionStatus = 'connected';
    state.socketId = socketId;
    renderConnectionStatus();
    renderQuestionsTab(handleVoteQuestion);

    // Requisito: No evento `connect`, reenviar `entrar_sala` automaticamente
    // se o aluno já estiver em uma sala.
    if (state.joinedRoom && state.username) {
      socketClient.emitEntrarSala(state.joinedRoom, state.username);
    }
  },

  onDisconnect() {
    state.connectionStatus = 'disconnected';
    renderConnectionStatus();
  },

  onConnectError() {
    state.connectionStatus = 'error';
    renderConnectionStatus();
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

  onListaDuvidas(questions) {
    state.questions = Array.isArray(questions) ? questions : [];
    renderQuestionsTab(handleVoteQuestion);
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
 * Ao clicar em uma das 4 salas no Lobby: valida o nome, emite `entrar_sala` e abre a Tela 2.
 * @param {string} roomId
 */
function handleEnterClassroomFromLobby(roomId) {
  const usernameInput = /** @type {HTMLInputElement | null} */ (
    document.getElementById('lobby-username-input')
  );
  const cleanName = (usernameInput ? usernameInput.value : state.username).trim().slice(0, 30);

  if (!cleanName) {
    showToast('Digite seu nome antes de escolher uma aula.', 'error');
    if (usernameInput) usernameInput.focus();
    return;
  }

  if (!ROOMS_CONFIG[roomId]) return;

  if (state.connectionStatus !== 'connected') {
    showToast('Servidor desconectado. Verifique se o backend está rodando na porta 3000.', 'error');
    return;
  }

  state.username = cleanName;
  if (usernameInput) usernameInput.value = cleanName;

  if (state.joinedRoom !== roomId) {
    state.messages = [];
    state.questions = [];
  }

  state.joinedRoom = roomId;
  state.currentScreen = 'classroom';
  state.activeTab = 'chat';

  socketClient.emitEntrarSala(roomId, cleanName);

  state.messages.push({
    type: 'aviso',
    payload: {
      text: `Você entrou em ${ROOMS_CONFIG[roomId].materia} (${roomId}) como ${cleanName}.`,
      createdAt: new Date().toISOString(),
    },
  });

  renderScreenVisibility();
  renderClassroomDetails();
  renderActiveTab();
  renderChatMessages();
  renderQuestionsTab(handleVoteQuestion);
}

/**
 * Retorna para a Tela 1 (Lobby), mantendo o nome preenchido e parando o vídeo do YouTube.
 */
function handleBackToLobby() {
  stopYoutubePlayer();
  state.currentScreen = 'lobby';
  renderScreenVisibility();

  const usernameInput = /** @type {HTMLInputElement | null} */ (
    document.getElementById('lobby-username-input')
  );
  if (usernameInput) {
    usernameInput.value = state.username;
  }
}

/**
 * Emite o voto em uma dúvida via `votar_duvida`.
 * @param {string} questionId
 */
function handleVoteQuestion(questionId) {
  if (!questionId) return;
  socketClient.emitVotarDuvida(questionId);
}

function setupDomListeners() {
  const backBtn = document.getElementById('back-to-lobby-btn');
  const tabBtnChat = document.getElementById('tab-btn-chat');
  const tabBtnQuestions = document.getElementById('tab-btn-questions');
  const chatForm = document.getElementById('chat-form');
  const chatInput = /** @type {HTMLInputElement | null} */ (document.getElementById('chat-input'));
  const charCounter = document.getElementById('char-counter');
  const questionCheckbox = /** @type {HTMLInputElement | null} */ (
    document.getElementById('question-checkbox')
  );

  if (backBtn) {
    backBtn.addEventListener('click', handleBackToLobby);
  }

  if (tabBtnChat) {
    tabBtnChat.addEventListener('click', () => {
      state.activeTab = 'chat';
      renderActiveTab();
    });
  }

  if (tabBtnQuestions) {
    tabBtnQuestions.addEventListener('click', () => {
      state.activeTab = 'questions';
      renderActiveTab();
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
      const cleanText = chatInput.value.trim().slice(0, 500);
      if (!cleanText) return;

      if (questionCheckbox && questionCheckbox.checked) {
        socketClient.emitNovaDuvida(cleanText);
        questionCheckbox.checked = false;
      } else {
        socketClient.emitMensagem(cleanText);
      }

      chatInput.value = '';
      if (charCounter) charCounter.textContent = '0/500';
      chatInput.focus();
    });
  }
}

setupDomListeners();
renderConnectionStatus();
renderLobbyCards(handleEnterClassroomFromLobby);
renderScreenVisibility();
renderActiveTab();
renderChatMessages();
renderQuestionsTab(handleVoteQuestion);
