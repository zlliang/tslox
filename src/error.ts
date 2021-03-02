import { Token } from './scanner'
import { color } from './color'

export class CliError extends Error {
  name = 'CliError'
  message: string

  constructor(message: string) {
    super()
    this.message = message
  }
}

export class SyntaxError extends Error {
  name = 'SyntaxError'
  message: string
  line?: number
  where?: string

  constructor(message: string, line?: number, where?: string) {
    super()
    this.message = message
    this.line = line
    this.where = where
  }
}

export class ResolvingError extends SyntaxError {
  name = 'ResolvingError'
}

export class RuntimeError extends Error {
  name = 'RuntimeError'
  message: string
  token: Token

  constructor(message: string, token: Token) {
    super()
    this.message = message
    this.token = token
  }
}

class ErrorReporter {
  hadCliError = false
  hadSyntaxError = false
  hadRuntimeError = false

  report(error: Error): void {
    let header = ''
    if (error instanceof SyntaxError && error.line) {
      header += `[${error.name} (line ${error.line}`
      if (error.where) header += ` at ${error.where}`
      header += ')'
    } else if (error instanceof RuntimeError) {
      header += `[${error.name} (line ${error.token.line})`
    } else if (error instanceof CliError) {
      header += `[${error.name}`
    } else {
      header += '[CliError'
    }
    header += ']'
    console.error(color.red(header) + ' ' + error.message)

    if (error instanceof RuntimeError) this.hadRuntimeError = true
    else if (error instanceof SyntaxError) this.hadSyntaxError = true
    else this.hadCliError = true
  }
}

export const errorReporter = new ErrorReporter()
