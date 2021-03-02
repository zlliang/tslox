import { LoxObject, LoxCallable, LoxClockFunction, LoxFunction } from './types'
import { Token, TokenType } from './scanner'
import * as ast from './ast'
import { RuntimeError, errorReporter } from './error'

export class Interpreter implements ast.SyntaxVisitor<LoxObject, void> {
  globals = new Environment()
  private environment = this.globals

  constructor() {
    // Native function 'clock'
    this.globals.define('clock', new LoxClockFunction())
  }

  interpret(statements: ast.Stmt[]): void {
    try {
      for (const stmt of statements) {
        stmt && this.execute(stmt)
      }
    } catch (error) {
      errorReporter.report(error)
    }
  }

  interpretExpr(expr: ast.Expr): void {
    const value = this.evaluate(expr)
    console.log(this.stringify(value))
  }

  private evaluate(expr: ast.Expr): LoxObject {
    return expr.accept(this)
  }

  private execute(stmt: ast.Stmt): void {
    stmt.accept(this)
  }

  executeBlock(statements: ast.Stmt[], environment: Environment): void {
    const previousEnvironment = this.environment
    try {
      this.environment = environment

      for (const stmt of statements) {
        stmt && this.execute(stmt)
      }
    } finally {
      this.environment = previousEnvironment
    }
  }

  private stringify(object: LoxObject) {
    if (object === null) return 'nil'

    if (typeof object === 'number') {
      let text = object.toString()
      if (text.endsWith('.0')) text = text.substring(0, text.length - 2)
      return text
    }

    return object.toString()
  }

  private isTruthy(object: LoxObject): boolean {
    if (object === null) return false
    if (typeof object === 'boolean') return object
    return true
  }

  private isEqual(a: LoxObject, b: LoxObject): boolean {
    if (a === null && b === null) return true
    if (a === null) return false

    return a === b
  }

  checkNumberOperand(token: Token, operand: LoxObject): void {
    if (typeof operand === 'number') return
    else throw new RuntimeError('Operand must be a number', token)
  }

  checkNumberOperands(token: Token, left: LoxObject, right: LoxObject): void {
    if (typeof left === 'number' && typeof right === 'number') return
    else throw new RuntimeError('Operands must be numbers', token)
  }

  visitBinaryExpr(expr: ast.BinaryExpr): LoxObject {
    const left = this.evaluate(expr.left)
    const right = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.Greater:
        this.checkNumberOperands(expr.operator, left, right)
        return (left as number) > (right as number)
      case TokenType.GreaterEqual:
        this.checkNumberOperands(expr.operator, left, right)
        return (left as number) >= (right as number)
      case TokenType.Less:
        this.checkNumberOperands(expr.operator, left, right)
        return (left as number) < (right as number)
      case TokenType.LessEqual:
        this.checkNumberOperands(expr.operator, left, right)
        return (left as number) <= (right as number)
      case TokenType.Minus:
        this.checkNumberOperands(expr.operator, left, right)
        return (left as number) - (right as number)
      case TokenType.BangEqual:
        return !this.isEqual(left, right)
      case TokenType.EqualEqual:
        return this.isEqual(left, right)
      case TokenType.Slash:
        this.checkNumberOperands(expr.operator, left, right)
        return (left as number) / (right as number)
      case TokenType.Star:
        this.checkNumberOperands(expr.operator, left, right)
        return (left as number) * (right as number)
      case TokenType.Plus:
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right
        }
        if (typeof left === 'string' && typeof right === 'string') {
          return left + right
        }
        throw new RuntimeError(
          'Operands must be two numbers or two strings',
          expr.operator
        )
    }

    // Unreachable
    return null
  }

  visitGroupingExpr(expr: ast.GroupingExpr): LoxObject {
    return this.evaluate(expr.expression)
  }

  visitLiteralExpr(expr: ast.LiteralExpr): LoxObject {
    return expr.value
  }

  visitUnaryExpr(expr: ast.UnaryExpr): LoxObject {
    const right = this.evaluate(expr.right)

    switch (expr.operator.type) {
      case TokenType.Bang:
        return !this.isTruthy(right)
      case TokenType.Minus:
        this.checkNumberOperand(expr.operator, right)
        return -(right as number)
    }

    // Unreachable
    return null
  }

  visitVariableExpr(expr: ast.VariableExpr): LoxObject {
    return this.environment.get(expr.name)
  }

  visitAssignExpr(expr: ast.AssignExpr): LoxObject {
    const value = this.evaluate(expr.value)
    this.environment.assign(expr.name, value)
    return value
  }

  visitLogicalExpr(expr: ast.LogicalExpr): LoxObject {
    const left = this.evaluate(expr.left)

    if (expr.operator.type === TokenType.Or) {
      if (this.isTruthy(left)) return left
    } else {
      if (!this.isTruthy(left)) return left
    }

    return this.evaluate(expr.right)
  }

  visitCallExpr(expr: ast.CallExpr): LoxObject {
    const callee = this.evaluate(expr.callee)
    const args = expr.args.map((arg) => this.evaluate(arg))

    if (!(callee instanceof LoxCallable)) {
      throw new RuntimeError('Can only call functions and classes', expr.paren)
    }

    if (args.length !== callee.arity()) {
      throw new RuntimeError(
        `Expected ${callee.arity()} arguments but got ${args.length}`,
        expr.paren
      )
    }

    return callee.call(this, args)
  }

  visitExpressionStmt(stmt: ast.ExpressionStmt): void {
    this.evaluate(stmt.expression)
  }

  visitPrintStmt(stmt: ast.PrintStmt): void {
    const value = this.evaluate(stmt.expression)
    console.log(this.stringify(value))
  }

  visitVarStmt(stmt: ast.VarStmt): void {
    let value: LoxObject = null
    if (stmt.initializer !== null) value = this.evaluate(stmt.initializer)

    this.environment.define(stmt.name.lexeme, value)
  }

  visitBlockStmt(stmt: ast.BlockStmt): void {
    this.executeBlock(stmt.statements, new Environment(this.environment))
  }

  visitIfStmt(stmt: ast.IfStmt): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch)
    } else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch)
    }
  }

  visitWhileStmt(stmt: ast.WhileStmt): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body)
    }
  }

  visitFunctionStmt(stmt: ast.FunctionStmt): void {
    const fun = new LoxFunction(stmt, this.environment)
    this.environment.define(stmt.name.lexeme, fun)
  }

  visitReturnStmt(stmt: ast.ReturnStmt): void {
    let value = null
    if (stmt.value !== null) value = this.evaluate(stmt.value)

    throw new LoxFunction.Return(value)
  }
}

export class Environment {
  enclosing: Environment | null
  private values: Record<string, LoxObject> = {}

  constructor(enclosing?: Environment) {
    if (enclosing) this.enclosing = enclosing
    else this.enclosing = null
  }

  define(name: string, value: LoxObject): void {
    this.values[name] = value
  }

  assign(name: Token, value: LoxObject): void {
    if (name.lexeme in this.values) {
      this.values[name.lexeme] = value
      return
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(name, value)
      return
    }

    throw new RuntimeError(`Undefined variable '${name.lexeme}'`, name)
  }

  get(name: Token): LoxObject {
    if (name.lexeme in this.values) return this.values[name.lexeme]
    if (this.enclosing !== null) return this.enclosing.get(name)

    throw new RuntimeError(`Undefined variable '${name.lexeme}'`, name)
  }
}
