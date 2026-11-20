// src/socket.ts
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { config } from '../config'

export function setupSocket(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        cors: { origin: process.env.CORS },
    });

    io.on('connection', (socket) => {
        console.log(`cliente conectado: ${socket.id}`);

        socket.on('mensagem', (text: string) => {
            if (!text.trim()) return;

            io.emit('mensagem', { id: socket.id, text });
            console.log(`Recebido de ${socket.id}: ${text}`);
        });

        socket.on('disconnect', () => {
            console.log(`Cliente desconectado: ${socket.id}`);
        });
    });

    return io;
}