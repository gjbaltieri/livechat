# 🎓 AulaLive — Chat e Dúvidas em Tempo Real para Aulas EAD

Aplicação web de comunicação em tempo real voltada para salas de aula EAD, construída com **Node.js, TypeScript, Express e Socket.IO**. Permite que alunos assistam a aulas simultaneamente, interajam em um chat isolado por sala e priorizem dúvidas coletivas através de um sistema de votação ao vivo.

🔗 **Acesse a demonstração ao vivo:** [https://livechat-peuq.onrender.com/](https://livechat-peuq.onrender.com/)

> 💡 **Dica para testar:** abra o link em **duas abas diferentes** (com nomes de alunos distintos) e entre na mesma aula para ver o chat, o contador de alunos e a ordenação de dúvidas atualizando em tempo real via WebSockets. *(Por estar hospedado no plano gratuito do Render, o primeiro carregamento pode levar cerca de 30 a 50 segundos para "acordar" o servidor).*

---

## 🚀 Funcionalidades

- **Lobby com 4 salas independentes:** isolamento completo de eventos e estado por sala (`aula-01` a `aula-04`).
- **Player integrado:** reprodução automática mutada com limpeza de stream ao sair da sala.
- **Chat ao vivo:** envio e recebimento instantâneo de mensagens com contador de usuários online por sala.
- **Sistema de Dúvidas com Votação:**
  - Alunos podem marcar uma mensagem como dúvida.
  - Outros alunos da mesma sala podem clicar em **"Também é minha dúvida"** para priorizar a pergunta.
  - A lista é reordenada automaticamente da dúvida mais votada para a menos votada, com bloqueio de voto duplicado por usuário.

---

## 🛠️ Decisões Técnicas e Backend

O foco principal do projeto foi construir um backend enxuto, resiliente e testável:

- **Isolamento de Salas (`Socket.IO Rooms`):** garante que mensagens, dúvidas e atualizações de contagem trafeguem estritamente entre os participantes da mesma aula.
- **Rate Limiting (Anti-Spam):** controle em memória no servidor que limita o envio de mensagens no chat (intervalo mínimo de 2s) e criação de dúvidas (intervalo mínimo de 30s), retornando eventos de erro tratados no frontend.
- **Prevenção contra XSS e Validação de Entrada:** validação de payloads no servidor (sala e nome obrigatórios) e renderização segura no cliente para impedir injeção de scripts via nome ou mensagem.
- **Prevenção de Colisão de IDs:** geração de identificadores únicos de dúvidas com `crypto.randomUUID()` (nativo do Node.js), substituindo `Date.now()` após testes automatizados identificarem colisões em envios simultâneos no mesmo milissegundo.
- **Entrega Unificada em Produção:** o servidor Express serve os arquivos estáticos de `public/` e o cliente do Socket.IO (`/socket.io/socket.io.js`) na mesma origem, eliminando problemas de CORS e *Mixed Content* em HTTPS.

---

## 🧪 Testes Automatizados

O projeto conta com suíte de **testes unitários e de integração** cobrindo:
- Isolamento de dúvidas entre salas diferentes.
- Bloqueio de voto duplicado pelo mesmo usuário e ordenação por relevância.
- Fluxo real de conexão WebSocket (`socket.io-client`), validação de entrada, isolamento de broadcast e disparo das regras de *rate limit*.

Para executar os testes:
```bash
npm test

Tecnologias Utilizadas
Backend: Node.js, TypeScript, Express, Socket.IO

Frontend: HTML5, CSS3, JavaScript (Vanilla)

Qualidade & Deploy: Testes automatizados (tsx --test, socket.io-client), Render

📦 Como rodar localmente

# 1. Clone o repositório
git clone https://github.com/gjbaltieri/livechat.git
cd livechat

# 2. Instale as dependências
npm install

# 3. Rode em modo desenvolvimento
npm run dev

# Ou faça o build e rode como em produção
npm run build
npm start

Acesse http://localhost:3000 no navegador.

🎥 Créditos das Aulas
Os vídeos exibidos nas salas de demonstração são conteúdos educacionais públicos incorporados diretamente do YouTube, mantendo os devidos créditos aos respectivos professores e canais abaixo de cada player.

## ⚠️ Nota sobre persistência

Os dados (dúvidas e votos) são armazenados **em memória** no servidor para manter a arquitetura focada em comunicação em tempo real via WebSockets. Por isso, o histórico é reiniciado sempre que o servidor é reiniciado — incluindo após períodos de inatividade no plano gratuito do Render.

👤 Autor
Desenvolvido por Gustavo Baltieri