import * as types from './types'
import { Token, TokenType } from './scanner'
import * as ast from './ast'
import { RuntimeError, errorReporter } from './error'

export class Interpreter implements ast.SyntaxVisitor<types.LoxObject, void> {
  globals = new Environment()
  private environment = this.globals
  private locals: Map<ast.Expr, number> = new Map()

  constructor() {
    // Native function 'clock'
    this.globals.define('clock', new types.LoxClockFunction())
  }

  interpret(statements: ast.Stmt[]): void
  interpret(expr: ast.Expr): void
  interpret(target: ast.Stmt[] | ast.Expr): void {
    if (target instanceof Array) {
      try {
        for (const stmt of target) {
          stmt && this.execute(stmt)
        }
      } catch (error) {
        errorReporter.report(error)
      }
    } else {
      const value = this.evaluate(target)
      console.log(this.stringify(value))
    }
  }

  resolve(expr: ast.Expr, depth: number): void {
    this.locals.set(expr, depth)
  }

  private evaluate(expr: ast.Expr): types.LoxObject {
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

  private lookupVariable(name: Token, expr: ast.Expr): types.LoxObject {
    const distance = this.locals.get(expr)
    if (distance !== undefined) return this.environment.getAt(distance, name)
    else return this.globals.get(name)
  }

  private stringify(object: types.LoxObject) {
    if (object === null) return 'nil'

    if (typeof object === 'number') {
      let text = object.toString()
      if (text.endsWith('.0')) text = text.substring(0, text.length - 2)
      return text
    }

    return object.toString()
  }

  private isTruthy(object: types.LoxObject): boolean {
    if (object === null) return false
    if (typeof object === 'boolean') return object
    return true
  }

  private isEqual(a: types.LoxObject, b: types.LoxObject): boolean {
    if (a === null && b === null) return true
    if (a === null) return false

    return a === b
  }

  checkNumberOperand(token: Token, operand: types.LoxObject): void {
    if (typeof operand === 'number') return
    else throw new RuntimeError('Operand must be a number', token)
  }

  checkNumberOperands(
    token: Token,
    left: types.LoxObject,
    right: types.LoxObject
  ): void {
    if (typeof left === 'number' && typeof right === 'number') return
    else throw new RuntimeError('Operands must be numbers', token)
  }

  visitBinaryExpr(expr: ast.BinaryExpr): types.LoxObject {
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

  visitGroupingExpr(expr: ast.GroupingExpr): types.LoxObject {
    return this.evaluate(expr.expression)
  }

  visitLiteralExpr(expr: ast.LiteralExpr): types.LoxObject {
    return expr.value
  }

  visitUnaryExpr(expr: ast.UnaryExpr): types.LoxObject {
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

  visitVariableExpr(expr: ast.VariableExpr): types.LoxObject {
    return this.lookupVariable(expr.name, expr)
  }

  visitAssignExpr(expr: ast.AssignExpr): types.LoxObject {
    const value = this.evaluate(expr.value)

    const distance = this.locals.get(expr)
    if (distance !== undefined)
      this.environment.assignAt(distance, expr.name, value)
    else this.globals.assign(expr.name, value)

    return value
  }

  visitLogicalExpr(expr: ast.LogicalExpr): types.LoxObject {
    const left = this.evaluate(expr.left)

    if (expr.operator.type === TokenType.Or) {
      if (this.isTruthy(left)) return left
    } else {
      if (!this.isTruthy(left)) return left
    }

    return this.evaluate(expr.right)
  }

  visitCallExpr(expr: ast.CallExpr): types.LoxObject {
    const callee = this.evaluate(expr.callee)
    const args = expr.args.map((arg) => this.evaluate(arg))

    if (!(callee instanceof types.LoxCallable)) {
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

  visitGetExpr(expr: ast.GetExpr): types.LoxObject {
    const object = this.evaluate(expr.object)
    if (object instanceof types.LoxInstance) return object.get(expr.name)

    throw new RuntimeError('Only class instances have properties', expr.name)
  }

  visitSetExpr(expr: ast.SetExpr): types.LoxObject {
    const object = this.evaluate(expr.object)

    if (!(object instanceof types.LoxInstance))
      throw new RuntimeError('Only class instances have fields', expr.name)

    const value = this.evaluate(expr.value)
    object.set(expr.name, value)
    return value
  }

  visitThisExpr(expr: ast.ThisExpr): types.LoxObject {
    return this.lookupVariable(expr.keyword, expr)
  }

  visitExpressionStmt(stmt: ast.ExpressionStmt): void {
    this.evaluate(stmt.expression)
  }

  visitPrintStmt(stmt: ast.PrintStmt): void {
    const value = this.evaluate(stmt.expression)
    console.log(this.stringify(value))
  }

  visitVarStmt(stmt: ast.VarStmt): void {
    let value: types.LoxObject = null
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
    const fun = new types.LoxFunction(stmt, this.environment, false)
    this.environment.define(stmt.name.lexeme, fun)
  }

  visitReturnStmt(stmt: ast.ReturnStmt): void {
    let value = null
    if (stmt.value !== null) value = this.evaluate(stmt.value)

    throw new types.LoxFunction.Return(value)
  }

  visitClassStmt(stmt: ast.ClassStmt): void {
    this.environment.define(stmt.name.lexeme, null)

    const methods: Record<string, types.LoxFunction> = {}
    stmt.methods.forEach((method) => {
      const fun = new types.LoxFunction(
        method,
        this.environment,
        method.name.lexeme === 'init'
      )
      methods[method.name.lexeme] = fun
    })

    const klass = new types.LoxClass(stmt.name.lexeme, methods)
    this.environment.assign(stmt.name, klass)
  }
}

export class Environment {
  enclosing: Environment | null
  private values: Record<string, types.LoxObject> = {}

  constructor(enclosing?: Environment) {
    if (enclosing) this.enclosing = enclosing
    else this.enclosing = null
  }

  ancestor(distance: number): Environment | null {
    if (distance === 0) return this
    else {
      let environment = this.enclosing || null
      for (let i = 1; i < distance; i++) {
        environment = environment?.enclosing || null
      }
      return environment
    }
  }

  define(name: string, value: types.LoxObject): void {
    this.values[name] = value
  }

  assign(name: Token, value: types.LoxObject): void {
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

  assignAt(distance: number, name: Token, value: types.LoxObject): void {
    const environment = this.ancestor(distance)
    if (environment !== null) environment.values[name.lexeme] = value

    // Unreachable (just in case)
    throw new RuntimeError(`Undefined variable '${name.lexeme}'`, name)
  }

  get(name: Token): types.LoxObject {
    if (name.lexeme in this.values) return this.values[name.lexeme]
    if (this.enclosing !== null) return this.enclosing.get(name)

    throw new RuntimeError(`Undefined variable '${name.lexeme}'`, name)
  }

  getAt(distance: number, name: Token): types.LoxObject {
    const environment = this.ancestor(distance)
    if (environment !== null) return environment.values[name.lexeme]

    // Unreachable (just in case)
    throw new RuntimeError(`Undefined variable '${name.lexeme}'`, name)
  }

  getThis(): types.LoxObject {
    return this.values['this']
  }
}
