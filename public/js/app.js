/**
 * @file Orquestrador principal do frontend AulaLive (fluxo em 2 telas + integração Socket.IO).
 */

import { ROOMS_CONFIG, state } from './state.js';
import { createSocketClient } from './socketService.js';
import {
  showToast,
  renderConnectionStatus,
  renderLobbyCards,
  renderLobbySelection,
  renderRoomParticipants,
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

  onContagemSalas(salas) {
    /** @type {Record<string, number>} */
    const nextCounts = {};
    if (Array.isArray(salas)) {
      salas.forEach((sala) => {
        if (sala && typeof sala.nome === 'string' && typeof sala.participantes === 'number') {
          nextCounts[sala.nome] = sala.participantes;
        }
      });
    }
    state.roomParticipants = nextCounts;
    renderRoomParticipants();
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
 * Seleciona visualmente uma sala no Lobby sem tentar entrar nem exibir erro.
 * @param {string} roomId
 */
function handleSelectRoom(roomId) {
  if (!ROOMS_CONFIG[roomId]) return;
  state.selectedRoom = roomId;
  renderLobbySelection();
}

/**
 * Valida sala selecionada e nome do aluno, emite `entrar_sala` e abre a Tela 2.
 */
function handleEnterClassroom() {
  const usernameInput = /** @type {HTMLInputElement | null} */ (
    document.getElementById('lobby-username-input')
  );
  const cleanName = (usernameInput ? usernameInput.value : state.username).trim().slice(0, 30);

  if (!state.selectedRoom || !ROOMS_CONFIG[state.selectedRoom]) {
    showToast('Selecione uma sala antes de entrar.', 'error');
    return;
  }

  if (!cleanName) {
    showToast('Informe seu nome antes de entrar.', 'error');
    if (usernameInput) usernameInput.focus();
    return;
  }

  if (state.connectionStatus !== 'connected') {
    showToast('Servidor desconectado. Aguarde a reconexão e tente novamente.', 'error');
    return;
  }

  const roomId = state.selectedRoom;
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
      text: `Você entrou em ${ROOMS_CONFIG[roomId].materia} como ${cleanName}.`,
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
 * Retorna para a Tela 1 (Lobby), emitindo `sair_sala` sem desconectar o socket,
 * mantendo o nome preenchido e parando o vídeo do YouTube.
 */
function handleBackToLobby() {
  socketClient.emitSairSala();
  stopYoutubePlayer();
  state.joinedRoom = null;
  state.currentScreen = 'lobby';
  renderScreenVisibility();
  renderLobbySelection();
  renderRoomParticipants();

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
  const lobbyEnterForm = document.getElementById('lobby-enter-form');
  const backBtn = document.getElementById('back-to-lobby-btn');
  const tabBtnChat = document.getElementById('tab-btn-chat');
  const tabBtnQuestions = document.getElementById('tab-btn-questions');
  const chatForm = document.getElementById('chat-form');
  const chatInput = /** @type {HTMLInputElement | null} */ (document.getElementById('chat-input'));
  const charCounter = document.getElementById('char-counter');
  const questionCheckbox = /** @type {HTMLInputElement | null} */ (
    document.getElementById('question-checkbox')
  );

  if (lobbyEnterForm) {
    lobbyEnterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handleEnterClassroom();
    });
  }

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

window.addEventListener('beforeunload', () => {
  socketClient.destroy();
});

setupDomListeners();
renderConnectionStatus();
renderLobbyCards(handleSelectRoom);
renderRoomParticipants();
renderScreenVisibility();
renderActiveTab();
renderChatMessages();
renderQuestionsTab(handleVoteQuestion);
