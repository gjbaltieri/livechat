import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { text } from 'stream/consumers';

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, { cors: { origin: "*" } })

io.on('connection', (socket) => {
    console.log(`cliente conectado: ${socket.id}`)

    socket.on('mensagem', (text: string) => {
        io.emit('mensagem', { id: socket.id, text });
        console.log(`Recebido de ${socket.id}: ${text}`)
    })
    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
    });
    io.emit('mensagem', { id: socket.id, text });
})
app.get('/', (req, res) => {
    res.send('Hello World')
})

httpServer.listen(3000, () => {
    console.log('Server is running on http://localhost:3000')
})