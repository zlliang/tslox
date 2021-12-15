import { Scanner } from "./scanner"
import { AstPrinter } from "./ast"
import { Parser } from "./parser"
import { Resolver } from "./resolver"
import { Interpreter } from "./interpreter"
import { errorReporter } from "./error"
import { color } from "./color"

type Mode = "script" | "repl"

export class Runner {
  private interpreter = new Interpreter()
  private resolver = new Resolver(this.interpreter)
  private mode: Mode
  private verbose: boolean

  constructor(mode: Mode, verbose: boolean) {
    this.mode = mode
    this.verbose = verbose
  }

  run(source: string): void {
    const scanner = new Scanner(source)
    const tokens = scanner.scanTokens()

    const parser = new Parser(tokens)

    if (this.mode === "script") {
      const statements = parser.parse()

      if (this.verbose) {
        const astPrinter = new AstPrinter()
        console.log(color.yellow("[AST]"))
        console.log(astPrinter.stringify(statements))
        console.log()
      }

      if (errorReporter.hadSyntaxError) return

      this.resolver.resolve(statements)

      if (errorReporter.hadSyntaxError) return

      if (this.verbose) console.log(color.yellow("[Output]"))
      this.interpreter.interpret(statements)
    } else {
      const [statements, expr] = parser.parseRepl()

      if (this.verbose) {
        const astPrinter = new AstPrinter()
        console.log(color.yellow("[AST]"))
        if (statements.length > 0) console.log(astPrinter.stringify(statements))
        if (expr !== null) console.log(astPrinter.stringify(expr))
        console.log()
      }

      if (errorReporter.hadSyntaxError) return

      if (statements.length > 0) this.resolver.resolve(statements)
      if (expr !== null) this.resolver.resolve(expr)

      if (errorReporter.hadSyntaxError) return

      if (this.verbose) console.log(color.yellow("[Output]"))
      if (statements.length > 0) this.interpreter.interpret(statements)
      if (expr !== null) this.interpreter.interpret(expr)
    }
  }
}
