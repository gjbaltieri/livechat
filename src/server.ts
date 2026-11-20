import express from 'express'
import { createServer } from 'http'
import { setupSocket } from './socket';
import { config } from './config';

const app = express()
const httpServer = createServer(app)


app.get('/', (req, res) => {
    res.send('Hello World')
})
setupSocket(httpServer)
httpServer.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`)
})


