/**
 * @file Camada de estado da aplicação e dados iniciais das 4 salas e dúvidas locais.
 */

/** @type {import('./types.js').RoomInfo[]} */
export const ROOMS = [
  {
    id: 'aula-01',
    title: 'Estruturas de Dados',
    teacher: 'Prof. Rafael Mendes • Árvores, Grafos e Complexidade',
  },
  {
    id: 'aula-02',
    title: 'Banco de Dados SQL',
    teacher: 'Profa. Camila Rocha • Índices, Joins e Normalização',
  },
  {
    id: 'aula-03',
    title: 'Desenvolvimento Web',
    teacher: 'Prof. Lucas Andrade • HTTP, WebSockets e Arquitetura',
  },
  {
    id: 'aula-04',
    title: 'Redes de Computadores',
    teacher: 'Profa. Helena Costa • TCP/IP, DNS e Roteamento',
  },
];

/**
 * Dúvidas iniciais de exemplo por sala (estado local do frontend).
 * @type {Record<string, import('./types.js').QuestionItem[]>}
 */
const initialQuestionsByRoom = {
  'aula-01': [
    {
      id: 'q-101',
      room: 'aula-01',
      author: 'Mariana Silva',
      text: 'Qual a diferença prática entre usar uma Árvore AVL e uma Red-Black em bancos de dados?',
      votes: 7,
      votedByMe: false,
      createdAt: '19:12',
    },
    {
      id: 'q-102',
      room: 'aula-01',
      author: 'Carlos Eduardo',
      text: 'Quando vale a pena usar lista encadeada em vez de um array dinâmico em JavaScript/TypeScript?',
      votes: 4,
      votedByMe: false,
      createdAt: '19:18',
    },
    {
      id: 'q-103',
      room: 'aula-01',
      author: 'Bianca Lopes',
      text: 'A busca em largura (BFS) garante sempre o menor caminho em grafos sem peso?',
      votes: 2,
      votedByMe: false,
      createdAt: '19:25',
    },
  ],
  'aula-02': [
    {
      id: 'q-201',
      room: 'aula-02',
      author: 'Pedro Henrique',
      text: 'Por que criar índices em todas as colunas pode deixar o INSERT e o UPDATE mais lentos?',
      votes: 9,
      votedByMe: false,
      createdAt: '19:10',
    },
    {
      id: 'q-202',
      room: 'aula-02',
      author: 'Fernanda Lima',
      text: 'Como evitar o problema de N+1 queries ao buscar usuários e seus pedidos?',
      votes: 6,
      votedByMe: false,
      createdAt: '19:22',
    },
  ],
  'aula-03': [
    {
      id: 'q-301',
      room: 'aula-03',
      author: 'Gustavo Almeida',
      text: 'Por que devemos usar textContent em vez de innerHTML ao renderizar mensagens vindas do Socket.IO?',
      votes: 11,
      votedByMe: false,
      createdAt: '19:05',
    },
    {
      id: 'q-302',
      room: 'aula-03',
      author: 'Letícia Souza',
      text: 'Se a conexão cair, o cliente Socket.IO entra automaticamente na sala ou precisamos reenviar entrar_sala no connect?',
      votes: 8,
      votedByMe: false,
      createdAt: '19:15',
    },
  ],
  'aula-04': [
    {
      id: 'q-401',
      room: 'aula-04',
      author: 'Thiago Martins',
      text: 'Qual a principal diferença entre o handshake do TCP e a comunicação via UDP em streaming ao vivo?',
      votes: 5,
      votedByMe: false,
      createdAt: '19:08',
    },
    {
      id: 'q-402',
      room: 'aula-04',
      author: 'Aline Ribeiro',
      text: 'O que acontece na camada de aplicação quando o WebSocket faz o upgrade a partir do HTTP?',
      votes: 3,
      votedByMe: false,
      createdAt: '19:20',
    },
  ],
};

export const state = {
  /** @type {'connecting' | 'connected' | 'disconnected' | 'error'} */
  connectionStatus: 'connecting',
  /** @type {string | null} */
  socketId: null,
  /** @type {string} */
  selectedRoom: 'aula-01',
  /** @type {string | null} */
  joinedRoom: null,
  /** @type {string} */
  username: '',
  /** @type {Array<{ type: 'mensagem' | 'aviso', payload: any }>} */
  messages: [],
  /** @type {Record<string, import('./types.js').QuestionItem[]>} */
  questionsByRoom: structuredClone(initialQuestionsByRoom),
};

/**
 * Retorna a lista de dúvidas da sala informada ordenada por número de votos (decrescente).
 * @param {string} roomId
 * @returns {import('./types.js').QuestionItem[]}
 */
export function getSortedQuestions(roomId) {
  const list = state.questionsByRoom[roomId] ?? [];
  return [...list].sort((a, b) => b.votes - a.votes);
}

/**
 * Adiciona uma nova dúvida localmente na sala atual.
 * @param {string} roomId
 * @param {string} author
 * @param {string} text
 * @param {string} formattedTime
 */
export function addLocalQuestion(roomId, author, text, formattedTime) {
  if (!state.questionsByRoom[roomId]) {
    state.questionsByRoom[roomId] = [];
  }
  state.questionsByRoom[roomId].push({
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    room: roomId,
    author,
    text,
    votes: 1,
    votedByMe: true,
    createdAt: formattedTime,
  });
}

/**
 * Alterna ou incrementa o voto em uma dúvida específica da sala e mantém reordenação.
 * @param {string} roomId
 * @param {string} questionId
 */
export function toggleVoteQuestion(roomId, questionId) {
  const list = state.questionsByRoom[roomId];
  if (!list) return;
  const item = list.find((q) => q.id === questionId);
  if (!item) return;

  if (item.votedByMe) {
    item.votes = Math.max(0, item.votes - 1);
    item.votedByMe = false;
  } else {
    item.votes += 1;
    item.votedByMe = true;
  }
}
