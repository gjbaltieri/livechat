import { Server } from 'socket.io';

export const updateRooms = (function atualizarSalas(io: Server) {
    const salas = [];

    for (const [room, sockets] of io.sockets.adapter.rooms) {
        if (io.sockets.sockets.has(room)) continue;

        salas.push({
            nome: room,
            participantes: sockets.size
        });
    }
    console.log('salas_atualizadas', salas);
})

