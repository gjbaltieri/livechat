/**
 * @file Serviço WebSocket isolado para comunicação com o servidor Socket.IO (http://localhost:3000).
 * Respeita estritamente os eventos definidos em `src/socket.ts`:
 *  - emit('entrar_sala', { room, username })
 *  - emit('mensagem', text)
 *  - on('mensagem', ({ id, username, text, createdAt }) => ...)
 *  - on('aviso', ({ text, createdAt }) => ...)
 *  - on('erro', ({ message }) => ...)
 */

const BACKEND_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'http://localhost:3000';

/**
 * Inicializa o cliente Socket.IO v4.8.1 e registra os callbacks da aplicação.
 * @param {{
 *   onConnect: (socketId: string) => void,
 *   onDisconnect: (reason: string) => void,
 *   onConnectError: (err: Error) => void,
 *   onMensagem: (payload: import('./types.js').MensagemPayload) => void,
 *   onAviso: (payload: import('./types.js').AvisoPayload) => void,
 *   onErro: (payload: import('./types.js').ErroPayload) => void,
 * }} handlers
 */
export function createSocketClient(handlers) {
  // global `io` carregado via CDN (Socket.IO v4.8.1)
  // @ts-ignore
  const socket = window.io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    handlers.onConnect(socket.id);
  });

  socket.on('disconnect', (reason) => {
    handlers.onDisconnect(reason);
  });

  socket.on('connect_error', (err) => {
    handlers.onConnectError(err);
  });

  socket.on('mensagem', (payload) => {
    handlers.onMensagem(payload);
  });

  socket.on('aviso', (payload) => {
    handlers.onAviso(payload);
  });

  socket.on('erro', (payload) => {
    handlers.onErro(payload);
  });

  return {
    /**
     * Envia o evento `entrar_sala` com `{ room, username }`.
     * @param {string} room
     * @param {string} username
     */
    emitEntrarSala(room, username) {
      socket.emit('entrar_sala', { room, username });
    },

    /**
     * Envia o evento `mensagem` com payload `text` (string simples).
     * @param {string} text
     */
    emitMensagem(text) {
      socket.emit('mensagem', text);
    },

    getId() {
      return socket.id ?? null;
    },
  };
}
