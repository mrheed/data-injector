import chalk from "chalk";
import net from 'net';
import path from "path";
import readXlsxFile from "read-excel-file/node";
import { createTunnel } from "tunnel-ssh";

export const readExcel = async (filename) => {
  return await readXlsxFile(path.join(__dirname, filename))
}

export const killProcess = () => {
  process.kill(process.pid, 'SIGTERM')
}

export const initializeTunnel = async (sshConfig, serverConfig, forwardConfig) => {
  return await createTunnel(
    {},
    Object.assign({}, serverConfig),
    Object.assign({
      keepaliveInterval: 1000,
      readyTimeout: 10000
    }, sshConfig),
    Object.assign({}, forwardConfig)
  )
}

export const wait = (seconds) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

export const logger = (message, level = 'INFO') => {
  const time = new Date().toLocaleTimeString();

  const colors = {
    'INFO': 'blue',
    'ERROR': 'red',
    'WARNING': 'yellow',
    'SUCCESS': 'green'
  };

  const color = colors[level] || 'white';

  const formattedMessage = `[${chalk.gray(time)}] [${chalk[color](level)}] ${message}`;

  console.log(formattedMessage);
}

export const consoleClearLine = (text) => {
  const time = new Date().toLocaleTimeString();
  const preline = '\x1b[0G\x1b[2K'
  const formattedMessage = `${preline}[${chalk.gray(time)}] [${chalk['blue']('INFO')}] ${text}`;
  process.stdout.write(formattedMessage); // Clear the line and move cursor to beginning
}

export const env = (prop, _default = null) => {
  if (!process.env.hasOwnProperty(prop) && _default == '') {
    if (_default === null) {
      throw new Error(`Environment variable ${prop} is not defined`);
    } else {
      return _default
    }
  }

  return process.env[prop]
}

export const isPortInUse = (port) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        reject(err);
      }
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(false);
      });
    });

    server.listen(port);
  });
};