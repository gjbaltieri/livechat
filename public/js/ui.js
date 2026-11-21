/**
 * @file Renderização da interface em 2 telas (Lobby e Sala da Aula) com proteção estrita contra XSS
 * (uso exclusivo de document.createElement e textContent).
 */

import { ROOMS_CONFIG, ROOMS_LIST, state, getRoomParticipantsCount } from './state.js';

/**
 * Formata a quantidade de participantes ("0 alunos online", "1 aluno online", "2 alunos online").
 * @param {number} count
 * @returns {string}
 */
function formatParticipantsLabel(count) {
  return count === 1 ? '1 aluno online' : `${count} alunos online`;
}

/**
 * Formata uma string ISO-8601 no formato local `HH:mm`.
 * @param {string} isoString
 * @returns {string}
 */
export function formatTimeHHMM(isoString) {
  const date = isoString ? new Date(isoString) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Exibe um toast visual temporário (erro, aviso ou sucesso).
 * Usa exclusivamente `textContent`.
 * @param {string} message
 * @param {'error' | 'info' | 'success'} [type='error']
 */
export function showToast(message, type = 'error') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const palette = {
    error: 'bg-red-950/95 border-red-500/50 text-red-200 shadow-red-950/50',
    info: 'bg-slate-900/95 border-indigo-500/40 text-slate-100 shadow-slate-950/50',
    success: 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50',
  };

  toast.className = `toast-enter pointer-events-auto flex items-start justify-between gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur ${palette[type] || palette.error}`;

  const textSpan = document.createElement('p');
  textSpan.className = 'text-xs sm:text-sm font-medium leading-snug';
  textSpan.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'text-xs opacity-70 hover:opacity-100 transition font-bold';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => toast.remove());

  toast.appendChild(textSpan);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.isConnected) toast.remove();
  }, 4200);
}

/**
 * Atualiza o indicador de status do servidor ao lado do nome do usuário na sala.
 */
export function renderConnectionStatus() {
  const badge = document.getElementById('room-conn-badge');
  const dot = document.getElementById('room-conn-dot');
  const text = document.getElementById('room-conn-text');
  const baseClass = 'inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border';

  if (!badge || !dot || !text) return;

  if (state.connectionStatus === 'connected') {
    badge.className = `${baseClass} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`;
    dot.className = 'w-2 h-2 rounded-full bg-emerald-400';
    text.textContent = 'Servidor conectado';
  } else if (state.connectionStatus === 'connecting') {
    badge.className = `${baseClass} bg-amber-500/10 text-amber-400 border-amber-500/20`;
    dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
    text.textContent = 'Conectando...';
  } else {
    badge.className = `${baseClass} bg-red-500/10 text-red-400 border-red-500/20`;
    dot.className = 'w-2 h-2 rounded-full bg-red-400';
    text.textContent = 'Desconectado';
  }
}

/**
 * Renderiza o grid de 4 cards de aulas ao vivo na Tela 1 (Lobby).
 * @param {(roomId: string) => void} onSelectRoom
 */
export function renderLobbyCards(onSelectRoom) {
  const grid = document.getElementById('lobby-rooms-grid');
  if (!grid) return;
  grid.replaceChildren();

  ROOMS_LIST.forEach((room) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.dataset.roomCard = room.id;
    card.setAttribute('aria-pressed', 'false');
    card.className =
      'group text-left p-5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/70 transition-all shadow-lg hover:shadow-indigo-950/40 flex flex-col justify-between gap-4';

    const topBar = document.createElement('div');
    topBar.className = 'flex items-center justify-between gap-2 w-full';

    const liveBadge = document.createElement('span');
    liveBadge.className =
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm';

    const pingDot = document.createElement('span');
    pingDot.className = 'w-1.5 h-1.5 rounded-full bg-white animate-ping';

    const liveText = document.createElement('span');
    liveText.textContent = 'AO VIVO';

    liveBadge.appendChild(pingDot);
    liveBadge.appendChild(liveText);

    const participantsBadge = document.createElement('span');
    participantsBadge.className =
      'inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-md bg-slate-950/80 text-slate-300 border border-slate-700/80';

    const participantsDot = document.createElement('span');
    participantsDot.className = 'w-1.5 h-1.5 rounded-full bg-indigo-400';

    const participantsText = document.createElement('span');
    participantsText.dataset.roomCount = room.id;
    participantsText.textContent = formatParticipantsLabel(getRoomParticipantsCount(room.id));

    participantsBadge.appendChild(participantsDot);
    participantsBadge.appendChild(participantsText);

    topBar.appendChild(liveBadge);
    topBar.appendChild(participantsBadge);

    const middleBox = document.createElement('div');
    middleBox.className = 'space-y-1';

    const subjectEl = document.createElement('h2');
    subjectEl.className =
      'text-lg font-bold text-white group-hover:text-indigo-300 transition';
    subjectEl.textContent = room.materia;

    const channelEl = document.createElement('p');
    channelEl.className = 'text-xs font-medium text-indigo-400';
    channelEl.textContent = room.canal;

    const descEl = document.createElement('p');
    descEl.className = 'text-xs text-slate-400 line-clamp-2 pt-1 leading-relaxed';
    descEl.textContent = room.descricao;

    middleBox.appendChild(subjectEl);
    middleBox.appendChild(channelEl);
    middleBox.appendChild(descEl);

    const footerBar = document.createElement('div');
    footerBar.className =
      'pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-400 group-hover:text-indigo-300';

    const selectLabel = document.createElement('span');
    selectLabel.dataset.roomSelectLabel = room.id;
    selectLabel.textContent = 'Selecionar aula';

    const arrowSpan = document.createElement('span');
    arrowSpan.dataset.roomSelectIcon = room.id;
    arrowSpan.className = 'transform group-hover:translate-x-1 transition';
    arrowSpan.textContent = '→';

    footerBar.appendChild(selectLabel);
    footerBar.appendChild(arrowSpan);

    card.appendChild(topBar);
    card.appendChild(middleBox);
    card.appendChild(footerBar);

    card.addEventListener('click', () => onSelectRoom(room.id));
    grid.appendChild(card);
  });

  renderLobbySelection();
}

/**
 * Destaca visualmente o card da sala selecionada no Lobby.
 */
export function renderLobbySelection() {
  const cards = document.querySelectorAll('[data-room-card]');
  const baseClass =
    'group text-left p-5 rounded-2xl transition-all shadow-lg flex flex-col justify-between gap-4';

  cards.forEach((card) => {
    const roomId = card.getAttribute('data-room-card');
    const isSelected = Boolean(roomId && state.selectedRoom === roomId);

    card.setAttribute('aria-pressed', String(isSelected));
    card.className = isSelected
      ? `${baseClass} bg-indigo-950/45 border-2 border-indigo-500 ring-2 ring-indigo-500/35 shadow-indigo-950/60`
      : `${baseClass} bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/70 hover:shadow-indigo-950/40`;

    const label = card.querySelector('[data-room-select-label]');
    const icon = card.querySelector('[data-room-select-icon]');
    if (label) {
      label.textContent = isSelected ? 'Aula selecionada' : 'Selecionar aula';
    }
    if (icon) {
      icon.textContent = isSelected ? '✓' : '→';
    }
  });
}

/**
 * Alterna a visibilidade entre Tela 1 (Lobby) e Tela 2 (Sala da Aula).
 */
export function renderScreenVisibility() {
  const lobbyScreen = document.getElementById('lobby-screen');
  const classroomScreen = document.getElementById('classroom-screen');
  if (!lobbyScreen || !classroomScreen) return;

  if (state.currentScreen === 'lobby') {
    lobbyScreen.classList.remove('hidden');
    lobbyScreen.classList.add('flex');
    classroomScreen.classList.add('hidden');
    classroomScreen.classList.remove('flex');
  } else {
    lobbyScreen.classList.add('hidden');
    lobbyScreen.classList.remove('flex');
    classroomScreen.classList.remove('hidden');
    classroomScreen.classList.add('flex');
  }
}

/**
 * Carrega os dados da sala ativa na Tela 2 (cabeçalho, iframe do YouTube sem autoplay e créditos).
 * Só atualiza o `src` do iframe se o vídeo mudou, evitando recarregar o player em reconexões.
 */
export function renderClassroomDetails() {
  if (!state.joinedRoom) return;
  const room = ROOMS_CONFIG[state.joinedRoom];
  if (!room) return;

  const subjectTitle = document.getElementById('room-subject-title');
  const studentName = document.getElementById('room-student-name');
  const creditsChannel = document.getElementById('credits-channel');
  const creditsTitle = document.getElementById('credits-title');
  const creditsDesc = document.getElementById('credits-description');
  const creditsLink = /** @type {HTMLAnchorElement | null} */ (
    document.getElementById('credits-youtube-link')
  );
  const iframe = /** @type {HTMLIFrameElement | null} */ (
    document.getElementById('youtube-iframe')
  );

  if (subjectTitle) subjectTitle.textContent = `${room.materia} — ${room.canal}`;
  if (studentName) studentName.textContent = state.username;

  if (creditsChannel) creditsChannel.textContent = room.canal;
  if (creditsTitle) creditsTitle.textContent = room.titulo;
  if (creditsDesc) creditsDesc.textContent = room.descricao;
  if (creditsLink) creditsLink.href = room.url;

  const targetSrc = `https://www.youtube.com/embed/${room.videoId}?autoplay=1&mute=1&rel=0`;
  if (iframe && iframe.getAttribute('src') !== targetSrc) {
    iframe.src = targetSrc;
  }

  renderRoomParticipants();
}

/**
 * Atualiza a contagem de alunos conectados nos cards do Lobby e no cabeçalho da sala ativa.
 * Usa exclusivamente `textContent`.
 */
export function renderRoomParticipants() {
  const lobbyCounters = document.querySelectorAll('[data-room-count]');
  lobbyCounters.forEach((el) => {
    const roomId = el.getAttribute('data-room-count');
    el.textContent = formatParticipantsLabel(getRoomParticipantsCount(roomId));
  });

  const activeRoomCounter = document.getElementById('room-participants-count');
  if (activeRoomCounter) {
    activeRoomCounter.textContent = formatParticipantsLabel(
      getRoomParticipantsCount(state.joinedRoom)
    );
  }
}

/**
 * Para o vídeo do YouTube limpando o `src` do iframe ao voltar ao Lobby.
 */
export function stopYoutubePlayer() {
  const iframe = /** @type {HTMLIFrameElement | null} */ (
    document.getElementById('youtube-iframe')
  );
  if (iframe) {
    iframe.src = '';
  }
}

/**
 * Alterna visualmente entre a Aba 1 ("Chat ao Vivo") e a Aba 2 ("Dúvidas (N)").
 */
export function renderActiveTab() {
  const btnChat = document.getElementById('tab-btn-chat');
  const btnQuestions = document.getElementById('tab-btn-questions');
  const panelChat = document.getElementById('tab-panel-chat');
  const panelQuestions = document.getElementById('tab-panel-questions');

  if (!btnChat || !btnQuestions || !panelChat || !panelQuestions) return;

  const isChat = state.activeTab === 'chat';

  btnChat.setAttribute('aria-selected', String(isChat));
  btnQuestions.setAttribute('aria-selected', String(!isChat));

  btnChat.className = isChat
    ? 'py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition bg-indigo-600 text-white shadow'
    : 'py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition text-slate-400 hover:text-slate-200 hover:bg-slate-800/60';

  btnQuestions.className = !isChat
    ? 'py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition bg-indigo-600 text-white shadow'
    : 'py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition text-slate-400 hover:text-slate-200 hover:bg-slate-800/60';

  if (isChat) {
    panelChat.classList.remove('hidden');
    panelChat.classList.add('flex');
    panelQuestions.classList.add('hidden');
    panelQuestions.classList.remove('flex');
  } else {
    panelChat.classList.add('hidden');
    panelChat.classList.remove('flex');
    panelQuestions.classList.remove('hidden');
    panelQuestions.classList.add('flex');
  }
}

/**
 * Renderiza a lista de mensagens e avisos de entrada/saída na Aba 1 (Chat ao Vivo).
 * Usa exclusivamente `textContent`.
 */
export function renderChatMessages() {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  container.replaceChildren();

  if (state.messages.length === 0) {
    const emptyBox = document.createElement('div');
    emptyBox.className =
      'h-full flex flex-col items-center justify-center text-center px-4 py-10 text-slate-500';

    const title = document.createElement('p');
    title.className = 'text-xs font-medium text-slate-400';
    title.textContent = 'Nenhuma mensagem nesta aula ainda.';

    const subtitle = document.createElement('p');
    subtitle.className = 'text-[11px] text-slate-500 mt-1';
    subtitle.textContent =
      'Envie uma mensagem para a turma ou marque "Marcar como dúvida" para enviar à aba Dúvidas.';

    emptyBox.appendChild(title);
    emptyBox.appendChild(subtitle);
    container.appendChild(emptyBox);
    return;
  }

  state.messages.forEach((item) => {
    if (item.type === 'aviso') {
      const notice = document.createElement('div');
      notice.className =
        'flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-800 text-xs text-slate-400';

      const textEl = document.createElement('span');
      textEl.className = 'italic';
      textEl.textContent = item.payload.text;

      const timeEl = document.createElement('span');
      timeEl.className = 'text-[10px] font-mono text-slate-500 shrink-0';
      timeEl.textContent = formatTimeHHMM(item.payload.createdAt);

      notice.appendChild(textEl);
      notice.appendChild(timeEl);
      container.appendChild(notice);
      return;
    }

    const msg = item.payload;
    const isMine = Boolean(state.socketId && msg.id === state.socketId);

    const wrapper = document.createElement('div');
    wrapper.className = isMine ? 'flex flex-col items-end' : 'flex flex-col items-start';

    const bubble = document.createElement('div');
    bubble.className = isMine
      ? 'max-w-[90%] rounded-2xl rounded-tr-sm px-3.5 py-2 bg-indigo-600/25 border border-indigo-500/40 text-slate-100'
      : 'max-w-[90%] rounded-2xl rounded-tl-sm px-3.5 py-2 bg-slate-800/90 border border-slate-700/70 text-slate-100';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between gap-3 mb-0.5';

    const authorEl = document.createElement('span');
    authorEl.className = isMine
      ? 'text-xs font-semibold text-indigo-300'
      : 'text-xs font-semibold text-emerald-400';
    authorEl.textContent = isMine ? `${msg.username} (você)` : msg.username;

    const timeEl = document.createElement('span');
    timeEl.className = 'text-[10px] font-mono text-slate-400';
    timeEl.textContent = formatTimeHHMM(msg.createdAt);

    header.appendChild(authorEl);
    header.appendChild(timeEl);

    const bodyEl = document.createElement('p');
    bodyEl.className = 'text-sm text-slate-100 break-words leading-relaxed';
    bodyEl.textContent = msg.text;

    bubble.appendChild(header);
    bubble.appendChild(bodyEl);
    wrapper.appendChild(bubble);
    container.appendChild(wrapper);
  });

  container.scrollTop = container.scrollHeight;
}

/**
 * Renderiza a Aba 2 ("Dúvidas (N)") com a lista vinda 100% do servidor (`lista_duvidas`).
 * Regras estritas do botão/selo por dúvida:
 *  - Se `duvida.voters[0] === socket.id`: selo/tag não clicável `"Minha dúvida · {duvida.voters.length}"`.
 *  - Se não for autor, mas `duvida.voters.includes(socket.id)`: botão destacado e desabilitado `"Também é minha dúvida ✓ · {duvida.voters.length}"`.
 *  - Caso contrário: botão clicável `"Também é minha dúvida · {duvida.voters.length}"` que emite `votar_duvida`.
 * Usa exclusivamente `textContent`.
 * @param {(questionId: string) => void} onVote
 */
export function renderQuestionsTab(onVote) {
  const container = document.getElementById('questions-list');
  const tabBtnQuestions = document.getElementById('tab-btn-questions');
  if (!container) return;

  const questions = Array.isArray(state.questions) ? state.questions : [];

  if (tabBtnQuestions) {
    tabBtnQuestions.textContent = `Dúvidas (${questions.length})`;
  }

  container.replaceChildren();

  if (questions.length === 0) {
    const empty = document.createElement('div');
    empty.className =
      'h-full flex flex-col items-center justify-center text-center py-10 px-4 text-xs text-slate-400';
    empty.textContent =
      'Nenhuma dúvida enviada nesta sala ainda. No chat, marque "Marcar como dúvida" para enviar a primeira!';
    container.appendChild(empty);
    return;
  }

  questions.forEach((duvida) => {
    const voters = Array.isArray(duvida.voters) ? duvida.voters : [];
    const voteCount = voters.length;
    const isAuthor = Boolean(state.socketId && voters[0] === state.socketId);
    const hasVoted = Boolean(state.socketId && voters.includes(state.socketId));

    const card = document.createElement('article');
    card.className =
      'p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2.5';

    const topRow = document.createElement('div');
    topRow.className = 'flex items-center justify-between gap-2';

    const authorSpan = document.createElement('span');
    authorSpan.className = 'text-xs font-semibold text-indigo-400 truncate';
    authorSpan.textContent = duvida.username;

    topRow.appendChild(authorSpan);

    const textP = document.createElement('p');
    textP.className = 'text-sm text-slate-100 break-words leading-relaxed';
    textP.textContent = duvida.text;

    const actionRow = document.createElement('div');
    actionRow.className = 'flex items-center justify-end pt-1';

    if (isAuthor) {
      // Selo/tag NÃO clicável para quem enviou a dúvida
      const authorBadge = document.createElement('span');
      authorBadge.className =
        'inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold select-none';
      authorBadge.textContent = `Minha dúvida · ${voteCount}`;
      actionRow.appendChild(authorBadge);
    } else if (hasVoted) {
      // Botão destacado e desabilitado para quem já votou
      const votedBtn = document.createElement('button');
      votedBtn.type = 'button';
      votedBtn.disabled = true;
      votedBtn.className =
        'inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-600/25 border border-indigo-500 text-indigo-200 text-xs font-semibold cursor-not-allowed opacity-90';
      votedBtn.textContent = `Também é minha dúvida ✓ · ${voteCount}`;
      actionRow.appendChild(votedBtn);
    } else {
      // Botão clicável para votar na dúvida
      const voteBtn = document.createElement('button');
      voteBtn.type = 'button';
      voteBtn.className =
        'inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white text-xs font-semibold transition';
      voteBtn.textContent = `Também é minha dúvida · ${voteCount}`;
      voteBtn.addEventListener('click', () => onVote(duvida.id));
      actionRow.appendChild(voteBtn);
    }

    card.appendChild(topRow);
    card.appendChild(textP);
    card.appendChild(actionRow);
    container.appendChild(card);
  });
}
