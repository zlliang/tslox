import { Scanner } from './scanner'
import { AstPrinter } from './ast'
import { Parser } from './parser'
import { Interpreter } from './interpreter'
import { errorReporter } from './error'
import { color } from './color'

type Mode = 'script' | 'repl'

export class Runner {
  private interpreter = new Interpreter()
  private mode: Mode

  constructor(mode?: Mode) {
    this.mode = mode || 'script'
  }

  run(source: string): void {
    const scanner = new Scanner(source)
    const tokens = scanner.scanTokens()

    const parser = new Parser(tokens)

    if (this.mode === 'script') {
      const statements = parser.parse()

      const astPrinter = new AstPrinter()
      console.log(color.yellow('[AST]'))
      console.log(astPrinter.stringify(statements))
      console.log()

      if (errorReporter.hadSyntaxError) return

      console.log(color.yellow('[Output]'))
      this.interpreter.interpret(statements)
    } else {
      const [statements, expr] = parser.parseRepl()

      const astPrinter = new AstPrinter()
      console.log(color.yellow('[AST]'))
      if (statements.length > 0) console.log(astPrinter.stringify(statements))
      if (expr !== null) console.log(astPrinter.stringify(expr))
      console.log()

      console.log(color.yellow('[Output]'))
      if (statements.length > 0) this.interpreter.interpret(statements)
      if (expr !== null) this.interpreter.interpretExpr(expr)
    }
  }
}
