/**
 * @file Componentes de renderização de UI seguros contra XSS (uso exclusivo de createElement + textContent).
 */

import { ROOMS, state, getSortedQuestions } from './state.js';

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
 * Usa exclusivamente `textContent` para evitar XSS.
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
 * Atualiza o selo de status da conexão com o servidor Socket.IO.
 */
export function renderConnectionBadge() {
  const badge = document.getElementById('conn-badge');
  const dot = document.getElementById('conn-dot');
  const text = document.getElementById('conn-text');
  if (!badge || !dot || !text) return;

  if (state.connectionStatus === 'connected') {
    badge.className =
      'inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    dot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400';
    text.textContent = 'Servidor conectado';
  } else if (state.connectionStatus === 'connecting') {
    badge.className =
      'inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20';
    dot.className = 'w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse';
    text.textContent = 'Conectando ao servidor...';
  } else {
    badge.className =
      'inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20';
    dot.className = 'w-1.5 h-1.5 rounded-full bg-red-400';
    text.textContent = 'Servidor offline (localhost:3000)';
  }
}

/**
 * Renderiza os 4 cards clicáveis de salas de aula e destaca visualmente a sala ativa.
 * @param {(roomId: string) => void} onSelectRoom
 */
export function renderRoomsBar(onSelectRoom) {
  const container = document.getElementById('rooms-bar');
  if (!container) return;
  container.replaceChildren();

  ROOMS.forEach((room) => {
    const isActive = state.selectedRoom === room.id;
    const isJoinedHere = state.joinedRoom === room.id;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(isActive));

    btn.className = isActive
      ? 'text-left p-3 rounded-xl border transition flex flex-col justify-between gap-1 bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-950/50'
      : 'text-left p-3 rounded-xl border transition flex flex-col justify-between gap-1 bg-slate-800/50 hover:bg-slate-800 border-slate-800 text-slate-300';

    const topRow = document.createElement('div');
    topRow.className = 'flex items-center justify-between gap-2 w-full';

    const codeBadge = document.createElement('span');
    codeBadge.className = isActive
      ? 'text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500 text-white font-semibold'
      : 'text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400';
    codeBadge.textContent = room.id;

    const statusPill = document.createElement('span');
    if (isJoinedHere) {
      statusPill.className = 'text-[11px] font-medium text-emerald-400 flex items-center gap-1';
      statusPill.textContent = '● Na sala';
    } else if (isActive) {
      statusPill.className = 'text-[11px] font-medium text-indigo-300';
      statusPill.textContent = 'Selecionada';
    } else {
      statusPill.className = 'text-[11px] text-slate-500';
      statusPill.textContent = 'Trocar aula';
    }

    topRow.appendChild(codeBadge);
    topRow.appendChild(statusPill);

    const titleEl = document.createElement('p');
    titleEl.className = 'text-sm font-semibold truncate mt-1';
    titleEl.textContent = room.title;

    btn.appendChild(topRow);
    btn.appendChild(titleEl);

    btn.addEventListener('click', () => onSelectRoom(room.id));
    container.appendChild(btn);
  });
}

/**
 * Atualiza os textos do player de vídeo simulado e cabeçalhos de acordo com a sala ativa.
 */
export function renderRoomHeaderAndPlayer() {
  const currentRoom = ROOMS.find((r) => r.id === state.selectedRoom) || ROOMS[0];

  const playerCode = document.getElementById('player-room-code');
  const playerTitle = document.getElementById('player-room-title');
  const playerTeacher = document.getElementById('player-room-teacher');
  const playerUserStatus = document.getElementById('player-user-status');
  const chatRoomBadge = document.getElementById('chat-room-badge');
  const chatSubtitle = document.getElementById('chat-subtitle');
  const chatInput = /** @type {HTMLInputElement | null} */ (document.getElementById('chat-input'));
  const chatSendBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('chat-send-btn'));
  const joinBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById('join-btn'));
  const questionsRoomLabel = document.getElementById('questions-room-label');

  if (playerCode) playerCode.textContent = currentRoom.id;
  if (playerTitle) playerTitle.textContent = currentRoom.title;
  if (playerTeacher) playerTeacher.textContent = currentRoom.teacher;
  if (chatRoomBadge) chatRoomBadge.textContent = currentRoom.id;
  if (questionsRoomLabel) {
    questionsRoomLabel.textContent = `${currentRoom.title} (${currentRoom.id})`;
  }

  const isInSelectedRoom = Boolean(state.joinedRoom && state.joinedRoom === state.selectedRoom && state.username);

  if (playerUserStatus) {
    playerUserStatus.textContent = isInSelectedRoom
      ? `${state.username} (${state.joinedRoom})`
      : 'Aguardando entrada na sala';
  }

  if (chatSubtitle) {
    chatSubtitle.textContent = isInSelectedRoom
      ? `Conectado como ${state.username}`
      : 'Digite seu nome no topo e clique em Entrar para participar';
  }

  if (joinBtn) {
    joinBtn.textContent = isInSelectedRoom ? 'Atualizar Nome' : 'Entrar';
  }

  const canSend = isInSelectedRoom && state.connectionStatus === 'connected';
  if (chatInput) {
    chatInput.disabled = !canSend;
    chatInput.placeholder = canSend
      ? `Mensagem em ${currentRoom.id}...`
      : 'Entre na sala para enviar mensagens...';
  }
  if (chatSendBtn) {
    chatSendBtn.disabled = !canSend;
  }
}

/**
 * Renderiza toda a lista de mensagens e avisos do chat com rolagem automática.
 * Usa exclusivamente `textContent`.
 */
export function renderChatMessages() {
  const container = document.getElementById('chat-messages');
  const countBadge = document.getElementById('chat-count-badge');
  if (!container) return;

  container.replaceChildren();

  const totalMsgs = state.messages.filter((m) => m.type === 'mensagem').length;
  if (countBadge) {
    countBadge.textContent = `${totalMsgs} ${totalMsgs === 1 ? 'msg' : 'msgs'}`;
  }

  if (state.messages.length === 0) {
    const emptyBox = document.createElement('div');
    emptyBox.className =
      'h-full flex flex-col items-center justify-center text-center px-4 py-10 text-slate-500';

    const title = document.createElement('p');
    title.className = 'text-xs font-medium text-slate-400';
    title.textContent = state.joinedRoom
      ? 'Nenhuma mensagem nesta sala ainda.'
      : 'Você ainda não entrou na sala.';

    const subtitle = document.createElement('p');
    subtitle.className = 'text-[11px] text-slate-500 mt-1';
    subtitle.textContent = state.joinedRoom
      ? 'Envie a primeira mensagem ou marque uma pergunta como dúvida!'
      : 'Informe seu nome no topo e clique em "Entrar" para iniciar o chat.';

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

    // Mensagem de usuário
    const msg = item.payload;
    const isMine = Boolean(state.socketId && msg.id === state.socketId);

    const wrapper = document.createElement('div');
    wrapper.className = isMine
      ? 'flex flex-col items-end'
      : 'flex flex-col items-start';

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

  // Rolagem automática para a última mensagem
  container.scrollTop = container.scrollHeight;
}

/**
 * Renderiza o painel "Dúvidas da Aula (Mais Votadas)" ordenado por votos.
 * Usa exclusivamente `textContent`.
 * @param {(questionId: string) => void} onVote
 */
export function renderQuestionsPanel(onVote) {
  const container = document.getElementById('questions-list');
  if (!container) return;

  container.replaceChildren();
  const questions = getSortedQuestions(state.selectedRoom);

  if (questions.length === 0) {
    const empty = document.createElement('div');
    empty.className =
      'col-span-full text-center py-8 px-4 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400';
    empty.textContent = 'Nenhuma dúvida cadastrada nesta aula ainda. Envie a primeira marcando "Marcar como dúvida" no chat!';
    container.appendChild(empty);
    return;
  }

  questions.forEach((q, idx) => {
    const card = document.createElement('article');
    card.className =
      'p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-4 hover:border-slate-700 transition';

    const leftCol = document.createElement('div');
    leftCol.className = 'flex-1 min-w-0';

    const metaRow = document.createElement('div');
    metaRow.className = 'flex items-center gap-2 flex-wrap mb-1';

    if (idx === 0 && q.votes > 0) {
      const topBadge = document.createElement('span');
      topBadge.className =
        'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30';
      topBadge.textContent = '★ Mais votada';
      metaRow.appendChild(topBadge);
    }

    const authorSpan = document.createElement('span');
    authorSpan.className = 'text-xs font-semibold text-indigo-400';
    authorSpan.textContent = q.author;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'text-[11px] font-mono text-slate-500';
    timeSpan.textContent = `• ${q.createdAt}`;

    metaRow.appendChild(authorSpan);
    metaRow.appendChild(timeSpan);

    const textP = document.createElement('p');
    textP.className = 'text-sm text-slate-200 break-words leading-relaxed';
    textP.textContent = q.text;

    leftCol.appendChild(metaRow);
    leftCol.appendChild(textP);

    const voteBtn = document.createElement('button');
    voteBtn.type = 'button';
    voteBtn.className = q.votedByMe
      ? 'shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-xl border bg-indigo-600/20 border-indigo-500 text-indigo-300 text-xs font-semibold transition'
      : 'shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-xl border bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 text-xs font-semibold transition';

    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'text-xs leading-none';
    arrowSpan.textContent = '▲ Votar';

    const countSpan = document.createElement('span');
    countSpan.className = 'text-sm font-bold font-mono mt-1';
    countSpan.textContent = String(q.votes);

    voteBtn.appendChild(arrowSpan);
    voteBtn.appendChild(countSpan);
    voteBtn.addEventListener('click', () => onVote(q.id));

    card.appendChild(leftCol);
    card.appendChild(voteBtn);
    container.appendChild(card);
  });
}
