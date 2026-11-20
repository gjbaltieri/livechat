// src/socket.ts
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config'

export function setupSocket(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        cors: { origin: config.corsOrigin },
        maxHttpBufferSize: 1e4
    });

    io.on('connection', (socket) => {
        console.log(`cliente conectado: ${socket.id}`);

        socket.on('mensagem', (text: unknown) => {
            if (typeof text !== 'string') return

            const message = text.trim();
            if (!message || message.length > 500) return

            io.emit('mensagem', { id: socket.id, text: message });
            console.log(`Recebido de ${socket.id}: ${text}`);
        });

        socket.on('disconnect', () => {
            console.log(`Cliente desconectado: ${socket.id}`);
        });
    });

    return io;
}