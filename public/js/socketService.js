/**
 * @file Serviço WebSocket isolado para comunicação com o servidor Socket.IO.
 * Conecta automaticamente na mesma origem/porta onde a página foi aberta.
 */

/**
 * Inicializa o cliente Socket.IO e registra os callbacks da aplicação.
 * @param {{
 *   onConnect: (socketId: string) => void,
 *   onDisconnect: (reason: string) => void,
 *   onConnectError: (err: Error) => void,
 *   onMensagem: (payload: import('./types.js').MensagemPayload) => void,
 *   onAviso: (payload: import('./types.js').AvisoPayload) => void,
 *   onListaDuvidas: (payload: import('./types.js').QuestionPayload[]) => void,
 *   onErro: (payload: import('./types.js').ErroPayload) => void,
 * }} handlers
 */
export function createSocketClient(handlers) {
  // global `io` servido pelo próprio backend em /socket.io/socket.io.js
  // @ts-ignore
  const socket = window.io();

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

  socket.on('lista_duvidas', (payload) => {
    handlers.onListaDuvidas(payload);
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

    /**
     * Envia o evento `nova_duvida` com payload `text` (string simples).
     * @param {string} text
     */
    emitNovaDuvida(text) {
      socket.emit('nova_duvida', text);
    },

    /**
     * Envia o evento `votar_duvida` com payload `questionId` (string simples).
     * @param {string} questionId
     */
    emitVotarDuvida(questionId) {
      socket.emit('votar_duvida', questionId);
    },

    getId() {
      return socket.id ?? null;
    },
  };
}
