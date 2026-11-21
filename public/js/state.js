/**
 * @file Objeto de configuração das 4 salas e estado reativo da aplicação AulaLive.
 * Nenhuma dúvida é mockada: a lista de dúvidas vem 100% do servidor via `lista_duvidas`.
 */

/** @type {Record<string, import('./types.js').RoomConfig>} */
export const ROOMS_CONFIG = {
  'aula-01': {
    id: 'aula-01',
    materia: 'Estruturas de Dados',
    videoId: '-twvgnfOnVQ',
    canal: 'Professor Douglas Maioli',
    titulo: 'O que é uma Estrutura de Dados? - Aula Inaugural',
    descricao:
      'Aula inaugural explicando o que são estruturas de dados (pilhas, filas, árvores) e como organizar informações na memória.',
    url: 'https://www.youtube.com/watch?v=-twvgnfOnVQ',
  },
  'aula-02': {
    id: 'aula-02',
    materia: 'Banco de Dados SQL',
    videoId: 'N6KsCN8kfOk',
    canal: 'Hashtag Programação',
    titulo: 'Introdução a Bancos de Dados e SQL',
    descricao:
      'Conceitos fundamentais de bancos de dados relacionais, tabelas, registros, SGBDs e o papel da linguagem SQL.',
    url: 'https://www.youtube.com/watch?v=N6KsCN8kfOk',
  },
  'aula-03': {
    id: 'aula-03',
    materia: 'Desenvolvimento Web',
    videoId: 'ws3ZyHMjIDY',
    canal: 'Senhor Programador',
    titulo: 'Introdução ao HTML | Criando uma Página Web | Parte 1',
    descricao:
      'Primeiros passos no desenvolvimento web com estrutura básica do HTML, tags essenciais e configuração no VS Code.',
    url: 'https://www.youtube.com/watch?v=ws3ZyHMjIDY',
  },
  'aula-04': {
    id: 'aula-04',
    materia: 'Redes de Computadores',
    videoId: 'QkMbqL8QD9w',
    canal: 'Curso em Vídeo',
    titulo: 'Como vai ser o Curso de Redes? - Curso Redes #01',
    descricao:
      'Introdução prática ao curso de Redes de Computadores com os professores Gustavo Guanabara e Alfredo Junior.',
    url: 'https://www.youtube.com/watch?v=QkMbqL8QD9w',
  },
};

/** @type {import('./types.js').RoomConfig[]} */
export const ROOMS_LIST = Object.values(ROOMS_CONFIG);

export const state = {
  /** @type {'connecting' | 'connected' | 'disconnected' | 'error'} */
  connectionStatus: 'connecting',
  /** @type {string | null} */
  socketId: null,
  /** @type {'lobby' | 'classroom'} */
  currentScreen: 'lobby',
  /** @type {'chat' | 'questions'} */
  activeTab: 'chat',
  /** @type {string | null} */
  selectedRoom: null,
  /** @type {string | null} */
  joinedRoom: null,
  /** @type {string} */
  username: '',
  /** @type {Array<{ type: 'mensagem' | 'aviso', payload: any }>} */
  messages: [],
  /**
   * Lista de dúvidas da sala atual vinda 100% do servidor (`lista_duvidas`).
   * @type {import('./types.js').QuestionPayload[]}
   */
  questions: [],
  /**
   * Quantidade de participantes conectados por sala vinda de `contagem_salas`.
   * @type {Record<string, number>}
   */
  roomParticipants: {},
};

/**
 * Retorna a quantidade de alunos conectados em uma sala (0 quando não houver nenhum).
 * @param {string | null} roomId
 * @returns {number}
 */
export function getRoomParticipantsCount(roomId) {
  if (!roomId) return 0;
  const count = state.roomParticipants[roomId];
  return typeof count === 'number' && count > 0 ? count : 0;
}
