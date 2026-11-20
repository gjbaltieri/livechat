/**
 * @file Contratos e tipos (via JSDoc) espelhando EXATAMENTE o backend (src/socket.ts e src/questions.ts).
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
 * Item de dúvida retornado no array do evento `lista_duvidas` pelo backend (`src/questions.ts`).
 * @typedef {Object} QuestionPayload
 * @property {string} id - Identificador da dúvida
 * @property {string} room - Sala da dúvida
 * @property {string} username - Nome do aluno autor da dúvida
 * @property {string} text - Texto da dúvida (máx. 300 caracteres no backend)
 * @property {string[]} voters - Array com os `socket.id` dos alunos que votaram (voters[0] é o autor)
 */

/**
 * Configuração de cada sala da plataforma AulaLive.
 * @typedef {Object} RoomConfig
 * @property {string} id
 * @property {string} materia
 * @property {string} videoId
 * @property {string} canal
 * @property {string} titulo
 * @property {string} descricao
 * @property {string} url
 */

export {};
