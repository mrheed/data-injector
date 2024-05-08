import pg from "pg";
import { initializeTunnel, logger } from "../utils/lib.js";
import { globalState } from "./state.js";

const { Client } = pg

export const createPgConnection = async () => {
  let dbPort = 60000;
  let dbHost = '127.0.0.1'

  if (globalState.get('withTunnel')) {
    logger('Initializing tunnel connection')
    const [tunnelServer, tunnelClient] = await initializeTunnel({
      host: process.env.TUNNEL_HOST,
      username: process.env.TUNNEL_USER,
      password: process.env.TUNNEL_PASSWORD,
      port: process.env.TUNNEL_PORT
    }, {
      port: dbPort,
      host: dbHost,
    }, {
      dstPort: process.env.DB_PORT,
      dstHost: process.env.DB_HOST
    })
    logger('Tunnel connected')
    globalState.set('tunnel', {
      server: tunnelServer,
      client: tunnelClient
    })
  } else {
    dbPort = process.env.DB_PORT
    dbHost = process.env.DB_HOST
  }

  const client = new Client({
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: dbHost,
    port: dbPort
  })

  logger('Initializing database connection')
  await client.connect()
  logger('Database connected')

  globalState.set('db', client)
}
