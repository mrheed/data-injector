import pg from "pg";
import { initializeTunnel, logger, env, isPortInUse } from "../utils/lib.js";
import { globalState } from "./state.js";

const { Client } = pg
const DEFAULT_PG_TUNNEL_PORT = 60000;
const DEFAULT_PG_TUNNEL_HOST = '127.0.0.1';

const tunnelProp = (prop, previx) => {
  if (previx == 'default') {
    return `TUNNEL_${prop}`
  }
  return `TUNNEL_${previx}_${prop}`
}

const dbProp = (prop, previx) => {
  if (previx == 'default') {
    return `DB_${prop}`
  }
  return `DB_${previx}_${prop}`
}

export const createPgConnection = async (dbPrefix = 'default', tunnelPrefix = 'default') => {
  const client = await createCustomPgConnection({
    withTunnel: globalState.get('withTunnel'),
    tunnelPrefix,
    dbPrefix,
  })

  logger(`[${dbPrefix}] Initializing database connection`)
  await client.connect()
  logger(`[${dbPrefix}] Database connected`)

  if (dbPrefix === 'default') {
    globalState.set(`db`, client)
  }
  globalState.set(`db_${dbPrefix.toLowerCase()}`, client)
}

export const createPgTunnelConnection = async (opts = {}) => {
  const sshConfig = {
    host: opts.TUNNEL_HOST,
    port: opts.TUNNEL_PORT,
    username: opts.TUNNEL_USER,
    password: opts.TUNNEL_PASSWORD,
  };

  const serverConfig = {
    host: opts.TUNNEL_FORWARD_HOST,
    port: opts.TUNNEL_FORWARD_PORT,
  };

  const forwardConfig = {
    dstAddr: opts.DB_HOST,
    dstPort: opts.DB_PORT,
  };

  return await initializeTunnel(sshConfig, serverConfig, forwardConfig);
}

export const createCustomPgConnection = async (opts = {}) => {
  let dbPort = DEFAULT_PG_TUNNEL_PORT;
  let dbHost = DEFAULT_PG_TUNNEL_HOST

  if (opts.withTunnel) {
    Object.assign(opts, {
      TUNNEL_FORWARD_HOST: dbHost,
      TUNNEL_FORWARD_PORT: dbPort,
      TUNNEL_HOST: opts.TUNNEL_HOST || env(tunnelProp('HOST', opts.tunnelPrefix)),
      TUNNEL_USER: opts.TUNNEL_USER || env(tunnelProp('USER', opts.tunnelPrefix)),
      TUNNEL_PASSWORD: opts.TUNNEL_PASSWORD || env(tunnelProp('PASSWORD', opts.tunnelPrefix)),
      TUNNEL_PORT: opts.TUNNEL_PORT || env(tunnelProp('PORT', opts.tunnelPrefix)),
      DB_PORT: opts.DB_PORT || env(dbProp('PORT', opts.dbPrefix)),
      DB_HOST: opts.DB_HOST || env(dbProp('HOST', opts.dbPrefix))
    })
    const portInUse = await isPortInUse(opts.TUNNEL_FORWARD_PORT);
    const tunnelName = `tunnel_${opts.tunnelPrefix.toLowerCase()}`
    if (portInUse) {
      if (globalState.get(tunnelName)) {
        logger(`[${opts.dbPrefix}] Using existing ${opts.tunnelPrefix} tunnel connection on port ${opts.TUNNEL_FORWARD_PORT}`)
      } else {
        throw new Error('Tunnel port is already in use and no existing tunnel connection found.')
      }
    } else {
      logger(`[${opts.dbPrefix}] Initializing tunnel ${opts.tunnelPrefix} connection`)
      const [tunnelServer, tunnelClient] = await createPgTunnelConnection(opts)
      const tunnel = {
        tunnelServer,
        tunnelClient
      }
      if (opts.tunnelPrefix === 'default') {
        globalState.set('tunnel', tunnel)
      }
      globalState.set(tunnelName, tunnel)
      if (opts.onTunnelCreated) {
        opts.onTunnelCreated(tunnelServer, tunnelClient)
      }
      logger(`[${opts.dbPrefix}] Tunnel ${opts.tunnelPrefix} connected`)
    }
  } else {
    dbPort = opts.DB_PORT || env(dbProp('PORT', opts.dbPrefix));
    dbHost = opts.DB_HOST || env(dbProp('HOST', opts.dbPrefix));
  }

  const clientConfig = {
    database: opts.DB_NAME || env(dbProp('NAME', opts.dbPrefix)),
    user: opts.DB_USER || env(dbProp('USER', opts.dbPrefix)),
    password: opts.DB_PASSWORD || env(dbProp('PASSWORD', opts.dbPrefix)),
    host: dbHost,
    port: dbPort
  };

  const client = new Client(clientConfig);

  return client
}