import { config } from './config';
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { addQuestion, getQuestions, voteQuestion } from './questions';
import { updateRooms } from './updateRooms';

export async function setupSocket(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        cors: { origin: config.corsOrigin },
        maxHttpBufferSize: 1e4, // 10 KB
    });

    io.on('connection', (socket) => {
        console.log(`Cliente conectado: ${socket.id}`);
        io.emit('contagem_salas', updateRooms(io));


        socket.on('entrar_sala', async (dados: { room?: string; username?: string }) => {
            if (!dados || typeof dados.room !== 'string' || typeof dados.username !== 'string') {
                socket.emit('erro', { message: 'Informe a sala e o nome de usuário.' });
                return;
            }

            const room = dados.room.trim();
            const username = dados.username.trim().slice(0, 30);


            if (!room || !username) {
                socket.emit('erro', { message: 'Sala e nome de usuário não podem estar vazios.' });
                return;
            }

            if (socket.data.room) {
                socket.leave(socket.data.room);
            }

            socket.data.room = room;

            socket.data.username = username;
            socket.join(room);
            io.emit('contagem_salas', updateRooms(io));
            socket.emit('lista_duvidas', getQuestions(room));
            socket.to(room).emit('aviso', {
                text: `${username} entrou na aula.`,
                createdAt: new Date().toISOString(),
            });
        });

        socket.on('mensagem', (text: string) => {
            const { room, username } = socket.data;


            if (typeof text !== 'string' || !text.trim()) return;

            const agora = Date.now();
            if (socket.data.lastMessageAt && agora - socket.data.lastMessageAt < 2000) {
                socket.emit('erro', { message: 'Aguarde um pouco antes de enviar outra mensagem.' });
                return;
            }
            socket.data.lastMessageAt = agora;

            const cleanText = text.trim().slice(0, 500);

            io.to(room).emit('mensagem', {
                id: socket.id,
                username,
                text: cleanText,
                createdAt: new Date().toISOString(),
            });
        });

        socket.on('nova_duvida', (text: string) => {
            const { room, username } = socket.data;

            if (!room || !username) {
                socket.emit('erro', { message: 'Entre em uma sala antes de enviar dúvidas.' });
                return;
            }

            if (typeof text !== 'string' || !text.trim()) return;

            const agora = Date.now();
            if (socket.data.lastQuestionAt && agora - socket.data.lastQuestionAt < 30_000) {
                socket.emit('erro', { message: 'Aguarde 30 segundos antes de enviar outra dúvida.' });
                return;
            }
            socket.data.lastQuestionAt = agora;

            addQuestion(room, socket.id, username, text.trim().slice(0, 300));
            io.to(room).emit('lista_duvidas', getQuestions(room));
        });

        socket.on('votar_duvida', (questionId: string) => {
            const { room } = socket.data;

            if (!room || typeof questionId !== 'string') return;

            voteQuestion(questionId, socket.id);

            io.to(room).emit('lista_duvidas', getQuestions(room));
        });

        socket.on('disconnect', () => {
            const { room, username } = socket.data;

            if (room && username) {
                socket.to(room).emit('aviso', {
                    text: `${username} saiu da aula.`,
                    createdAt: new Date().toISOString(),
                });
            }

            console.log(`Cliente desconectado: ${socket.id}`);
            io.emit('contagem_salas', updateRooms(io));
        });

        socket.on('sair_sala', () => {
            const { room, username } = socket.data;
            if (!room) return;

            socket.leave(room);
            socket.data.room = undefined;

            if (username) {
                socket.to(room).emit('aviso', {
                    text: `${username} saiu da aula.`,
                    createdAt: new Date().toISOString(),
                });
            }

            io.emit('contagem_salas', updateRooms(io));
        });
    });

    return io;
}