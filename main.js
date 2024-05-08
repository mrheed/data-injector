import path from "path";
import { killProcess, logger } from "./utils/lib.js";
import { configDotenv } from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers"
import { globalState } from "./services/state.js";

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('target', {
      alias: 't',
      type: 'string',
      demandOption: true,
      description: 'Path to the target file',
    })
    .option('withTunnel', {
      alias: 'w',
      type: 'boolean',
      description: 'Use a tunnel for the operation (optional)',
    })
    .help()
    .argv;

  try {
    const targetFolder = argv.target
    const targetBasepath = path.dirname(new URL(import.meta.url).pathname) + '/' + targetFolder

    global.__dirname = targetBasepath

    configDotenv({
      path: targetBasepath + '/.env'
    })

    globalState.set('withTunnel', argv.withTunnel)

    const importedModule = await import(`./${targetFolder}/index.js`)
    await importedModule.default()
  } catch (error) {
    const stack = error.stack
    logger(stack, 'ERROR')
  } finally {
    killProcess()
  }
}

async function handleExitSignal(signal) {
  if (globalState.get('withTunnel')) {
    logger(`Closing tunnel`);
    globalState.get('tunnel.server').close();
  }
  logger(`${signal} Detected, exiting main process`);
  process.exit(0);
}

process.on('SIGINT', () => handleExitSignal('SIGINT'));
process.on('SIGTERM', () => handleExitSignal('SIGTERM'));

main()