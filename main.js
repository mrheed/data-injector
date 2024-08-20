import { killProcess, logger } from "./utils/lib.js";
import path from "path"
import yargs from "yargs";
import { hideBin } from "yargs/helpers"
import { globalState } from "./services/state.js";
import { RunCommand } from "./command/index.js";

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('target', {
      alias: 't',
      type: 'string',
      demandOption: true,
      description: 'Path to the target file',
    })
    .option('generate', {
      alias: 'g',
      type: 'string',
      description: 'Generate boilerplate for a new script',
    })
    .option('withTunnel', {
      alias: 'w',
      type: 'boolean',
      description: 'Use a tunnel for the operation (optional)',
    })
    .help()
    .argv;

  try {
    let command
    if (argv.generate) {
      // command = new GenerateCommand()
    } else if (argv.target) {
      command = new RunCommand()
    }
    command.setBasePath(path.dirname(new URL(import.meta.url).pathname))
    command.setArgv(argv)
    await command.start()
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