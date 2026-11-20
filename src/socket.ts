import { config } from './config';
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

export function setupSocket(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        cors: { origin: config.corsOrigin },
        maxHttpBufferSize: 1e4, // 10 KB
    });

    io.on('connection', (socket) => {
        console.log(`Cliente conectado: ${socket.id}`);

        socket.on('entrar_sala', (dados: { room?: string; username?: string }) => {
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

            // Avisa apenas os outros alunos daquela sala
            socket.to(room).emit('aviso', {
                text: `${username} entrou na aula.`,
                createdAt: new Date().toISOString(),
            });
        });

        socket.on('mensagem', (text: string) => {

            const { room, username } = socket.data;

            if (!room || !username) {
                socket.emit('erro', { message: 'Entre em uma sala antes de enviar mensagens.' });
                return;
            }

            if (typeof text !== 'string' || !text.trim()) return;

            const agora = Date.now();
            if (socket.data.lastMessageAt && agora - socket.data.lastMessageAt < 2000) {
                socket.emit('erro', { message: 'Aguarde um pouco antes de enviar outra mensagem' })
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

        socket.on('disconnect', () => {
            const { room, username } = socket.data;

            if (room && username) {
                socket.to(room).emit('aviso', {
                    text: `${username} saiu da aula.`,
                    createdAt: new Date().toISOString(),
                });
            }

            console.log(`Cliente desconectado: ${socket.id}`);
        });
    });

    return io;
}