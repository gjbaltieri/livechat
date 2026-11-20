import { after, afterEach, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server as HttpServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { setupSocket } from '../src/socket';

function waitForEvent<T>(socket: ClientSocket, event: string, timeoutMs = 2000): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.off(event, onEvent);
            reject(new Error(`Timeout aguardando evento "${event}"`));
        }, timeoutMs);

        const onEvent = (payload: T) => {
            clearTimeout(timer);
            resolve(payload);
        };

        socket.once(event, onEvent);
    });
}

function expectNoEvent(socket: ClientSocket, event: string, waitMs = 250): Promise<void> {
    return new Promise((resolve, reject) => {
        const onEvent = (payload: unknown) => {
            clearTimeout(timer);
            reject(new Error(`Evento "${event}" não deveria ser recebido, mas chegou: ${JSON.stringify(payload)}`));
        };

        const timer = setTimeout(() => {
            socket.off(event, onEvent);
            resolve();
        }, waitMs);

        socket.once(event, onEvent);
    });
}

describe('src/socket.ts', () => {
    let httpServer: HttpServer;
    let io: SocketIOServer;
    let baseUrl: string;
    const clients: ClientSocket[] = [];

    function connectClient(): Promise<ClientSocket> {
        return new Promise((resolve, reject) => {
            const client = ioClient(baseUrl, {
                transports: ['websocket'],
                forceNew: true,
            });
            clients.push(client);
            client.once('connect', () => resolve(client));
            client.once('connect_error', reject);
        });
    }

    async function joinRoom(client: ClientSocket, room: string, username: string) {
        const listPromise = waitForEvent<unknown[]>(client, 'lista_duvidas');
        client.emit('entrar_sala', { room, username });
        return listPromise;
    }

    before(async () => {
        httpServer = createServer();
        io = setupSocket(httpServer);

        await new Promise<void>((resolve) => {
            httpServer.listen(0, () => resolve());
        });

        const { port } = httpServer.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${port}`;
    });

    afterEach(() => {
        while (clients.length > 0) {
            const client = clients.pop();
            client?.disconnect();
        }
    });

    after(async () => {
        await new Promise<void>((resolve) => {
            io.close(() => resolve());
        });
    });

    it('validação de entrada: retorna evento erro ao tentar entrar sem room ou username', async () => {
        // Arrange
        const client = await connectClient();

        // Act & Assert (sem room)
        const erroSemRoomPromise = waitForEvent<{ message: string }>(client, 'erro');
        client.emit('entrar_sala', { username: 'Ana' });
        const erroSemRoom = await erroSemRoomPromise;
        assert.ok(erroSemRoom.message);

        // Act & Assert (sem username)
        const erroSemUsernamePromise = waitForEvent<{ message: string }>(client, 'erro');
        client.emit('entrar_sala', { room: 'aula-01' });
        const erroSemUsername = await erroSemUsernamePromise;
        assert.ok(erroSemUsername.message);

        // Act & Assert (valores vazios / espaços)
        const erroVazioPromise = waitForEvent<{ message: string }>(client, 'erro');
        client.emit('entrar_sala', { room: '   ', username: 'Ana' });
        const erroVazio = await erroVazioPromise;
        assert.ok(erroVazio.message);
    });

    it('isolamento de salas: mensagem na aula-01 chega na aula-01 e não chega na aula-02', async () => {
        // Arrange
        const [alunoA, alunoB, alunoC] = await Promise.all([
            connectClient(),
            connectClient(),
            connectClient(),
        ]);

        await Promise.all([
            joinRoom(alunoA, 'aula-01-msg', 'Aluno A'),
            joinRoom(alunoB, 'aula-01-msg', 'Aluno B'),
            joinRoom(alunoC, 'aula-02-msg', 'Aluno C'),
        ]);

        const msgParaBPromise = waitForEvent<{ username: string; text: string }>(alunoB, 'mensagem');
        const semMsgParaCPromise = expectNoEvent(alunoC, 'mensagem');

        // Act
        alunoA.emit('mensagem', 'Olá pessoal da aula 01!');

        // Assert
        const [msgParaB] = await Promise.all([msgParaBPromise, semMsgParaCPromise]);
        assert.equal(msgParaB.username, 'Aluno A');
        assert.equal(msgParaB.text, 'Olá pessoal da aula 01!');
    });

    it('rate limit de mensagens: 2 mensagens seguidas em menos de 2s dispara evento erro', async () => {
        // Arrange
        const client = await connectClient();
        await joinRoom(client, 'aula-rate-msg', 'Ana');

        const primeiraMsgPromise = waitForEvent<{ text: string }>(client, 'mensagem');
        const erroPromise = waitForEvent<{ message: string }>(client, 'erro');

        // Act
        client.emit('mensagem', 'Primeira mensagem');
        await primeiraMsgPromise;
        client.emit('mensagem', 'Segunda mensagem imediata');

        // Assert
        const erro = await erroPromise;
        assert.match(erro.message, /aguarde/i);
    });

    it('fluxo de dúvidas e votos: nova_duvida e votar_duvida atualizam ambos os alunos na sala com 2 votos', async () => {
        // Arrange
        const room = 'aula-fluxo-duvidas';
        const [alunoA, alunoB] = await Promise.all([connectClient(), connectClient()]);
        await Promise.all([
            joinRoom(alunoA, room, 'Aluno A'),
            joinRoom(alunoB, room, 'Aluno B'),
        ]);

        type QuestionPayload = {
            id: string;
            room: string;
            username: string;
            text: string;
            voters: string[];
        };

        // Act 1: Aluno A envia nova_duvida
        const listaAPromise1 = waitForEvent<QuestionPayload[]>(alunoA, 'lista_duvidas');
        const listaBPromise1 = waitForEvent<QuestionPayload[]>(alunoB, 'lista_duvidas');
        alunoA.emit('nova_duvida', 'Qual o horário da prova?');

        const [listaA1, listaB1] = await Promise.all([listaAPromise1, listaBPromise1]);

        // Assert 1
        assert.equal(listaA1.length, 1);
        assert.equal(listaB1.length, 1);
        assert.equal(listaA1[0].text, 'Qual o horário da prova?');
        assert.equal(listaA1[0].voters.length, 1);
        assert.equal(listaB1[0].voters.length, 1);

        // Act 2: Aluno B vota na dúvida
        const listaAPromise2 = waitForEvent<QuestionPayload[]>(alunoA, 'lista_duvidas');
        const listaBPromise2 = waitForEvent<QuestionPayload[]>(alunoB, 'lista_duvidas');
        alunoB.emit('votar_duvida', listaB1[0].id);

        const [listaA2, listaB2] = await Promise.all([listaAPromise2, listaBPromise2]);

        // Assert 2
        assert.equal(listaA2[0].voters.length, 2);
        assert.equal(listaB2[0].voters.length, 2);
    });

    it('rate limit de dúvidas: 2 dúvidas seguidas em menos de 30s dispara evento erro', async () => {
        // Arrange
        const client = await connectClient();
        await joinRoom(client, 'aula-rate-duvida', 'Carlos');

        const primeiraDuvidaPromise = waitForEvent<unknown[]>(client, 'lista_duvidas');
        const erroPromise = waitForEvent<{ message: string }>(client, 'erro');

        // Act
        client.emit('nova_duvida', 'Primeira dúvida');
        await primeiraDuvidaPromise;
        client.emit('nova_duvida', 'Segunda dúvida imediata');

        // Assert
        const erro = await erroPromise;
        assert.match(erro.message, /30 segundos/i);
    });
});
