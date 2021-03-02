import { Interpreter, Environment } from './interpreter'
import * as ast from './ast'

export abstract class LoxCallable {
  abstract arity(): number
  abstract call(interpreter: Interpreter, args: LoxObject[]): LoxObject
  abstract toString(): string
}

export class LoxClockFunction extends LoxCallable {
  arity(): number {
    return 0
  }

  call(): LoxObject {
    return Date.now().valueOf() / 1000.0
  }

  toString(): string {
    return "<native fun 'clock'>"
  }
}

export class LoxFunction extends LoxCallable {
  static Return = class Return {
    value: LoxObject

    constructor(value: LoxObject) {
      this.value = value
    }
  }

  private declaration: ast.FunctionStmt
  private closure: Environment

  constructor(declaration: ast.FunctionStmt, closure: Environment) {
    super()
    this.closure = closure
    this.declaration = declaration
  }

  arity(): number {
    return this.declaration.params.length
  }

  call(interpreter: Interpreter, args: LoxObject[]): LoxObject {
    const environment = new Environment(this.closure)
    for (const [i, param] of this.declaration.params.entries()) {
      environment.define(param.lexeme, args[i])
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment)
    } catch (e) {
      if (e instanceof LoxFunction.Return) return e.value
      else throw e // Propagate if a real error occurs
    }

    return null
  }

  toString(): string {
    return `<fun ${this.declaration.name.lexeme}>`
  }
}

export type LoxObject = LoxCallable | string | number | boolean | null
