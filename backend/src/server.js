import { app, sessionPool } from './app.js'
import { env } from './config/env.js'
import { prisma } from './db/prisma.js'

const server = app.listen(env.PORT, () => {
  console.log(`DevHub API écoute sur le port ${env.PORT}`)
})

async function shutdown(signal) {
  console.log(`${signal} reçu, arrêt du serveur…`)
  server.close(async () => {
    await prisma.$disconnect()
    await sessionPool.end()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
