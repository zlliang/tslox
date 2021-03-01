import { Token, LoxObject } from './scanner'

export interface Expr {
  accept<R>(visitor: ExprVisitor<R>): R
}

export interface ExprVisitor<R> {
  visitBinaryExpr(expr: BinaryExpr): R
  visitGroupingExpr(expr: GroupingExpr): R
  visitLiteralExpr(expr: LiteralExpr): R
  visitUnaryExpr(expr: UnaryExpr): R
  visitVariableExpr(expr: VariableExpr): R
  visitAssignExpr(expr: AssignExpr): R
  visitLogicalExpr(expr: LogicalExpr): R
}

export interface Stmt {
  accept<R>(visitor: StmtVisitor<R>): R
}

export interface StmtVisitor<R> {
  visitExpressionStmt(stmt: ExpressionStmt): R
  visitPrintStmt(stmt: PrintStmt): R
  visitVarStmt(stmt: VarStmt): R
  visitBlockStmt(stmt: BlockStmt): R
  visitIfStmt(stmt: IfStmt): R
  visitWhileStmt(stmt: WhileStmt): R
}

export type SyntaxVisitor<RE, RS> = ExprVisitor<RE> & StmtVisitor<RS>

export class BinaryExpr implements Expr {
  left: Expr
  operator: Token
  right: Expr

  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left
    this.operator = operator
    this.right = right
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitBinaryExpr(this)
  }
}

export class GroupingExpr implements Expr {
  expression: Expr

  constructor(expression: Expr) {
    this.expression = expression
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGroupingExpr(this)
  }
}

export class LiteralExpr implements Expr {
  value: LoxObject

  constructor(value: LoxObject) {
    this.value = value
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this)
  }
}

export class UnaryExpr implements Expr {
  operator: Token
  right: Expr

  constructor(operator: Token, right: Expr) {
    this.operator = operator
    this.right = right
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitUnaryExpr(this)
  }
}

export class VariableExpr implements Expr {
  name: Token

  constructor(name: Token) {
    this.name = name
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitVariableExpr(this)
  }
}

export class AssignExpr implements Expr {
  name: Token
  value: Expr

  constructor(name: Token, value: Expr) {
    this.name = name
    this.value = value
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitAssignExpr(this)
  }
}

export class LogicalExpr implements Expr {
  left: Expr
  operator: Token
  right: Expr

  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left
    this.operator = operator
    this.right = right
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLogicalExpr(this)
  }
}

export class ExpressionStmt implements Stmt {
  expression: Expr

  constructor(expression: Expr) {
    this.expression = expression
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this)
  }
}

export class PrintStmt implements Stmt {
  expression: Expr

  constructor(expression: Expr) {
    this.expression = expression
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitPrintStmt(this)
  }
}

export class VarStmt implements Stmt {
  name: Token
  initializer: Expr | null

  constructor(name: Token, initializer: Expr | null) {
    this.name = name
    this.initializer = initializer
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVarStmt(this)
  }
}

export class BlockStmt implements Stmt {
  statements: Stmt[]

  constructor(statements: Stmt[]) {
    this.statements = statements
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this)
  }
}

export class IfStmt implements Stmt {
  condition: Expr
  thenBranch: Stmt
  elseBranch: Stmt | null

  constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null) {
    this.condition = condition
    this.thenBranch = thenBranch
    this.elseBranch = elseBranch
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitIfStmt(this)
  }
}

export class WhileStmt implements Stmt {
  condition: Expr
  body: Stmt

  constructor(condition: Expr, body: Stmt) {
    this.condition = condition
    this.body = body
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitWhileStmt(this)
  }
}

export class AstPrinter implements SyntaxVisitor<string, string> {
  // Print AST as S-expressions
  stringify(target: Expr | Stmt | Stmt[]): string {
    if (target instanceof Array) {
      return target.map((stmt) => stmt.accept(this)).join('\n')
    } else {
      return target.accept(this)
    }
  }

  private parenthesize(name: string, ...exprs: Expr[]) {
    let result = ''

    result += `(${name}`
    for (const expr of exprs) {
      result += ` ${expr.accept(this)}`
    }
    result += ')'

    return result
  }

  private indent(lines: string) {
    return lines
      .split('\n')
      .map((line) => '  ' + line)
      .join('\n')
  }

  visitBinaryExpr(expr: BinaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
  }

  visitGroupingExpr(expr: GroupingExpr): string {
    return this.parenthesize('group', expr.expression)
  }

  visitLiteralExpr(expr: LiteralExpr): string {
    if (expr.value === null) return 'nil'
    if (typeof expr.value === 'string') return `"${expr.value}"`
    return expr.value.toString()
  }

  visitUnaryExpr(expr: UnaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.right)
  }

  visitVariableExpr(expr: VariableExpr): string {
    return expr.name.lexeme
  }

  visitAssignExpr(expr: AssignExpr): string {
    const name = new VariableExpr(expr.name)
    return this.parenthesize('assign', name, expr.value)
  }

  visitLogicalExpr(expr: LogicalExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
  }

  visitPrintStmt(stmt: PrintStmt): string {
    return this.parenthesize('print', stmt.expression)
  }

  visitExpressionStmt(stmt: ExpressionStmt): string {
    return this.parenthesize('expression', stmt.expression)
  }

  visitVarStmt(stmt: VarStmt): string {
    const name = new VariableExpr(stmt.name)
    if (stmt.initializer) {
      return this.parenthesize('var', name, stmt.initializer)
    } else {
      return this.parenthesize('var', name)
    }
  }

  visitBlockStmt(stmt: BlockStmt): string {
    let result = '(block\n'
    for (const [i, innerStmt] of stmt.statements.entries()) {
      result += this.indent(this.stringify(innerStmt))
      if (i < stmt.statements.length - 1) result += '\n'
    }
    result += ')'

    return result
  }

  visitIfStmt(stmt: IfStmt): string {
    let result = `(if ${this.stringify(stmt.condition)}\n`

    const thenBranchResult = this.stringify(stmt.thenBranch)
    result += this.indent(thenBranchResult)

    if (stmt.elseBranch !== null) {
      result += '\n'
      const elseBranchResult = this.stringify(stmt.elseBranch)
      result += this.indent(elseBranchResult)
    }
    result += ')'

    return result
  }

  visitWhileStmt(stmt: WhileStmt): string {
    let result = `(while ${this.stringify(stmt.condition)}\n`
    const bodyResult = this.stringify(stmt.body)
    result += this.indent(bodyResult)

    return result
  }
}
