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
 *   onContagemSalas: (payload: import('./types.js').ContagemSalaPayload[]) => void,
 *   onErro: (payload: import('./types.js').ErroPayload) => void,
 * }} handlers
 */
export function createSocketClient(handlers) {
  // global `io` servido pelo próprio backend em /socket.io/socket.io.js
  // @ts-ignore
  if (typeof window.io !== 'function') {
    handlers.onConnectError(new Error('Socket.IO client não carregado.'));
    return {
      emitEntrarSala() {},
      emitSairSala() {},
      emitMensagem() {},
      emitNovaDuvida() {},
      emitVotarDuvida() {},
      getId() {
        return null;
      },
      destroy() {},
    };
  }

  // @ts-ignore
  const socket = window.io();

  const handleConnect = () => handlers.onConnect(socket.id);
  const handleDisconnect = (reason) => handlers.onDisconnect(reason);
  const handleConnectError = (err) => handlers.onConnectError(err);
  const handleMensagem = (payload) => handlers.onMensagem(payload);
  const handleAviso = (payload) => handlers.onAviso(payload);
  const handleListaDuvidas = (payload) => handlers.onListaDuvidas(payload);
  const handleContagemSalas = (payload) => handlers.onContagemSalas(payload);
  const handleErro = (payload) => handlers.onErro(payload);

  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  socket.on('connect_error', handleConnectError);
  socket.on('mensagem', handleMensagem);
  socket.on('aviso', handleAviso);
  socket.on('lista_duvidas', handleListaDuvidas);
  socket.on('contagem_salas', handleContagemSalas);
  socket.on('erro', handleErro);

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
     * Envia o evento `sair_sala` para sair da sala atual sem desconectar o socket.
     */
    emitSairSala() {
      socket.emit('sair_sala');
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

    /**
     * Remove todos os listeners registrados para evitar vazamentos ou duplicidade.
     */
    destroy() {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('mensagem', handleMensagem);
      socket.off('aviso', handleAviso);
      socket.off('lista_duvidas', handleListaDuvidas);
      socket.off('contagem_salas', handleContagemSalas);
      socket.off('erro', handleErro);
    },
  };
}
