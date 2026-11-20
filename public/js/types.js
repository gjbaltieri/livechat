/**
 * @file Contratos e tipos (via JSDoc) espelhando EXATAMENTE o backend (src/socket.ts)
 * e os modelos locais da seção de dúvidas.
 */

/**
 * Payload enviado no evento `entrar_sala`.
 * @typedef {Object} EntrarSalaPayload
 * @property {string} room - Identificador da sala (ex: "aula-01")
 * @property {string} username - Nome do aluno (máx. 30 caracteres no backend)
 */

/**
 * Payload recebido no evento `mensagem`.
 * @typedef {Object} MensagemPayload
 * @property {string} id - ID do socket remetente (socket.id)
 * @property {string} username - Nome do aluno
 * @property {string} text - Conteúdo da mensagem (máx. 500 caracteres)
 * @property {string} createdAt - Data/hora ISO-8601 gerada pelo servidor
 */

/**
 * Payload recebido no evento `aviso` (entrada e saída da sala).
 * @typedef {Object} AvisoPayload
 * @property {string} text - Texto do aviso (ex: "Maria entrou na aula.")
 * @property {string} createdAt - Data/hora ISO-8601 gerada pelo servidor
 */

/**
 * Payload recebido no evento `erro`.
 * @typedef {Object} ErroPayload
 * @property {string} message - Mensagem explicativa da validação ou rate-limit do backend
 */

/**
 * Modelo local de uma sala fixa da plataforma.
 * @typedef {Object} RoomInfo
 * @property {string} id
 * @property {string} title
 * @property {string} teacher
 */

/**
 * Modelo local de uma dúvida (armazenada em memória no frontend).
 * @typedef {Object} QuestionItem
 * @property {string} id
 * @property {string} room
 * @property {string} author
 * @property {string} text
 * @property {number} votes
 * @property {boolean} votedByMe
 * @property {string} createdAt
 */

export {};
