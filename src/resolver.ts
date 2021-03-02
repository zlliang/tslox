import { Token } from './scanner'
import * as ast from './ast'
import { Interpreter } from './interpreter'
import { ResolvingError, errorReporter } from './error'

type Scope = Record<string, boolean>

enum FunctionType {
  None = 'None',
  Function = 'Function',
  Initializer = 'Initializer',
  Method = 'Method'
}

enum ClassType {
  None = 'None',
  Class = 'Class'
}

class ScopeStack extends Array<Scope> {
  isEmpty(): boolean {
    return this.length < 1
  }

  peek(): Scope {
    return this[this.length - 1]
  }
}

export class Resolver implements ast.SyntaxVisitor<void, void> {
  private interpreter: Interpreter
  private scopes: ScopeStack = new ScopeStack()
  private currentFunction = FunctionType.None
  private currentClass = ClassType.None

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
  }

  resolve(statements: ast.Stmt[]): void
  resolve(stmt: ast.Stmt | ast.Expr): void
  resolve(target: ast.Stmt[] | ast.Stmt | ast.Expr): void {
    if (target instanceof Array) target.forEach((stmt) => this.resolve(stmt))
    else target.accept(this)
  }

  resolveLocal(expr: ast.Expr, name: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (name.lexeme in this.scopes[i]) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i)
      }
    }
  }

  resolveFunction(fun: ast.FunctionStmt, type: FunctionType): void {
    const enclosingFunction = this.currentFunction
    this.currentFunction = type

    this.beginScope()
    fun.params.forEach((param) => {
      this.declare(param)
      this.define(param)
    })
    this.resolve(fun.body)
    this.endScope()

    this.currentFunction = enclosingFunction
  }

  private beginScope(): void {
    this.scopes.push({})
  }

  private endScope(): void {
    this.scopes.pop()
  }

  private declare(name: Token): void {
    if (this.scopes.isEmpty()) return

    const scope = this.scopes.peek()
    if (name.lexeme in scope)
      errorReporter.report(
        new ResolvingError(
          'Already variable with this name in this scope',
          name.line
        )
      )
    scope[name.lexeme] = false
  }

  private define(name: Token): void {
    if (this.scopes.isEmpty()) return

    const scope = this.scopes.peek()
    scope[name.lexeme] = true
  }

  visitBinaryExpr(expr: ast.BinaryExpr): void {
    this.resolve(expr.left)
    this.resolve(expr.right)
  }

  visitLogicalExpr(expr: ast.LogicalExpr): void {
    this.resolve(expr.left)
    this.resolve(expr.right)
  }

  visitCallExpr(expr: ast.CallExpr): void {
    this.resolve(expr.callee)
    expr.args.forEach((arg) => this.resolve(arg))
  }

  visitGroupingExpr(expr: ast.GroupingExpr): void {
    this.resolve(expr.expression)
  }

  visitLiteralExpr(): void {
    return
  }

  visitUnaryExpr(expr: ast.UnaryExpr): void {
    this.resolve(expr.right)
  }

  visitVariableExpr(expr: ast.VariableExpr): void {
    if (
      !this.scopes.isEmpty() &&
      this.scopes.peek()[expr.name.lexeme] === false
    )
      errorReporter.report(
        new ResolvingError(
          "Can't read local variable in its own initializer",
          expr.name.line
        )
      )

    this.resolveLocal(expr, expr.name)
  }

  visitGetExpr(expr: ast.GetExpr): void {
    this.resolve(expr.object)
  }

  visitSetExpr(expr: ast.SetExpr): void {
    this.resolve(expr.value)
    this.resolve(expr.object)
  }

  visitThisExpr(expr: ast.ThisExpr): void {
    if (this.currentClass === ClassType.None) {
      errorReporter.report(
        new ResolvingError(
          "Can't use 'this' outside of a class",
          expr.keyword.line
        )
      )
      return
    }
    this.resolveLocal(expr, expr.keyword)
  }

  visitExpressionStmt(stmt: ast.ExpressionStmt): void {
    this.resolve(stmt.expression)
  }

  visitIfStmt(stmt: ast.IfStmt): void {
    this.resolve(stmt.condition)
    this.resolve(stmt.thenBranch)
    if (stmt.elseBranch !== null) this.resolve(stmt.elseBranch)
  }

  visitPrintStmt(stmt: ast.PrintStmt): void {
    this.resolve(stmt.expression)
  }

  visitReturnStmt(stmt: ast.ReturnStmt): void {
    if (this.currentFunction === FunctionType.None) {
      errorReporter.report(
        new ResolvingError(
          "Can't return from top-level code",
          stmt.keyword.line
        )
      )
    }

    if (stmt.value !== null) {
      if (this.currentFunction === FunctionType.Initializer) {
        errorReporter.report(
          new ResolvingError(
            "Can't return a value from an initializer",
            stmt.keyword.line
          )
        )
      }
      this.resolve(stmt.value)
    }
  }

  visitWhileStmt(stmt: ast.WhileStmt): void {
    this.resolve(stmt.condition)
    this.resolve(stmt.body)
  }

  visitAssignExpr(expr: ast.AssignExpr): void {
    this.resolve(expr.value)
    this.resolveLocal(expr, expr.name)
  }

  visitBlockStmt(stmt: ast.BlockStmt): void {
    this.beginScope()
    this.resolve(stmt.statements)
    this.endScope()
  }

  visitVarStmt(stmt: ast.VarStmt): void {
    this.declare(stmt.name)
    if (stmt.initializer !== null) this.resolve(stmt.initializer)
    this.define(stmt.name)
  }

  visitFunctionStmt(stmt: ast.FunctionStmt): void {
    this.declare(stmt.name)
    this.define(stmt.name)

    this.resolveFunction(stmt, FunctionType.Function)
  }

  visitClassStmt(stmt: ast.ClassStmt): void {
    const enclosingClass = this.currentClass
    this.currentClass = ClassType.Class

    this.declare(stmt.name)
    this.define(stmt.name)

    this.beginScope()
    this.scopes.peek()['this'] = true
    stmt.methods.forEach((method) => {
      const declaration =
        method.name.lexeme === 'init'
          ? FunctionType.Initializer
          : FunctionType.Method
      this.resolveFunction(method, declaration)
    })
    this.endScope()

    this.currentClass = enclosingClass
  }
}
