import { Server } from 'socket.io';

const ROOMS = ['aula-01', 'aula-02', 'aula-03', 'aula-04'];

export function updateRooms(io: Server) {
    const salas = ROOMS.map((room) => ({
        nome: room,
        participantes: io.sockets.adapter.rooms.get(room)?.size ?? 0,
    }));

    return salas
}