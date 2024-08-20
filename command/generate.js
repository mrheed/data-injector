import { logger } from "../utils/lib.js"
import Command from "./command.js"
import fs from "fs"
import path from "path"

class GenerateCommand extends Command {
  constructor() {
    super()
    this.name = 'generate'
    this.description = 'Generate a new module'
  }

  async start() {
    const moduleName = this.argv.generate
    if (!moduleName) {
      logger('Please provide a name for the module', 'ERROR')
      return
    }

    const modulePath = path.join(this.basePath, 'modules', moduleName);
    if (fs.existsSync(modulePath)) {
      logger(`Module ${moduleName} already exists`, 'WARNING');
      return;
    }

    fs.mkdirSync(modulePath, { recursive: true });

    const indexFile = path.join(modulePath, `index.js`);
    const envFile = path.join(modulePath, `.env`);

    fs.writeFileSync(indexFile, `// ${moduleName} module
import { globalState } from "../../services/state.js";

export default async function main() {
  const db = globalState.get("db");

  try {
    await db.query("begin");
    console.log("${moduleName} database transaction started");
    await db.query("commit");
  } catch (error) {
    await db.query("rollback");
    throw new Error(error);
  }
}`);
    fs.writeFileSync(envFile, `# ${moduleName} module
# Database settings
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

# Tunnel settings
TUNNEL_HOST=
TUNNEL_USER=
TUNNEL_PASSWORD=
TUNNEL_PORT=\n`);
    logger(`Module ${moduleName} generated successfully at ${modulePath}`, 'INFO');
  }
}

export default GenerateCommand