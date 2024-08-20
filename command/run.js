import { configDotenv } from "dotenv"
import Command from "./command.js"
import { globalState } from "../services/state.js"
import path from "path"
import { createPgConnection } from "../services/connection.js"

class RunCommand extends Command {
  constructor() {
    super()
    this.name = 'run'
    this.description = 'Run a module'
  }

  async start() {
    const targetFolder = this.argv.target
    const targetBasepath = path.join(this.basePath, 'modules', targetFolder)

    global.__dirname = targetBasepath

    configDotenv({
      path: targetBasepath + '/.env'
    })

    globalState.set('withTunnel', this.argv.withTunnel)

    await createPgConnection()

    const importedModule = await import(`${targetBasepath}/index.js`)
    await importedModule.default()
  }
}

export default RunCommand