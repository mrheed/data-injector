import { configDotenv } from "dotenv"
import Command from "./command.js"
import { globalState } from "../services/state.js"

class RunCommand extends Command {
  constructor() {
    super()
    this.name = 'run'
  }

  async start() {
    const targetFolder = this.argv.target
    const targetBasepath = this.basePath + '/modules/' + targetFolder

    global.__dirname = targetBasepath

    configDotenv({
      path: targetBasepath + '/.env'
    })

    globalState.set('withTunnel', this.argv.withTunnel)

    const importedModule = await import(`${targetBasepath}/index.js`)
    await importedModule.default()
  }
}

export default RunCommand