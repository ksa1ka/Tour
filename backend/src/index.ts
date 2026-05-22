import { createServer } from 'node:http'

import { app } from './app.js'
import { env } from './config/env.js'
import { initSocket } from './socket/index.js'

const httpServer = createServer(app)

initSocket(httpServer)

httpServer.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`)
})
