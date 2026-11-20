import express from 'express'
import { createServer } from 'http'
import { setupSocket } from './socket';
import { config } from './config';

const app = express()
export const httpServer = createServer(app)


app.get('/', (req, res) => {
    res.send('Hello World')
})
setupSocket(httpServer)
httpServer.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`)
})


