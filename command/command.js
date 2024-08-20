class Command {
  constructor() {
    this.name = 'command'
    this.argv = {}
    this.basePath = ''
  }

  setArgv(argv) {
    this.argv = argv
  }

  setBasePath(basePath) {
    this.basePath = basePath
  }

  async start() {
    throw new Error('Not implemented')
  }
}

export default Command