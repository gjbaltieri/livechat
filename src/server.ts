import express from 'express'
import path from 'path'
import { createServer } from 'http'
import { setupSocket } from './socket';
import { config } from './config';

const app = express()
const httpServer = createServer(app)

app.use(express.static(path.resolve(process.cwd(), 'public')))
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


