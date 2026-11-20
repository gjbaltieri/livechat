import express from 'express'
import { createServer } from 'http'
import { setupSocket } from './socket';
import { config } from './config';

const app = express()
const httpServer = createServer(app)


app.get('/', (req, res) => {
    res.send('Hello World')
})
const io = setupSocket(httpServer)
httpServer.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`)
})

function encerrar() {
    console.log('\nEncerrando servidor...');
    io.close(() => {
        httpServer.close(() => {
            process.exit(0);
        });
    });
}

process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);


