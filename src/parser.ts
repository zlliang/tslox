import { Token, TokenType } from './scanner'
import * as ast from './ast'
import { SyntaxError, errorReporter } from './error'

export class Parser {
  private tokens: Token[]
  private current = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  parse(): ast.Stmt[] {
    const statements: ast.Stmt[] = []
    while (!this.isAtEnd()) {
      try {
        statements.push(this.declaration())
      } catch (error) {
        errorReporter.report(error)
        this.synchronize()
      }
    }
    return statements
  }

  parseRepl(): [ast.Stmt[], ast.Expr | null] {
    // In REPL, users can input zero or more statements (ending with ';') and
    // maybe an expression. The interpreter execute all the statements. If there
    // is an expression, it evaluate print its value.
    let cursor = this.current
    const statements: ast.Stmt[] = []
    try {
      while (!this.isAtEnd()) {
        statements.push(this.declaration())
        cursor = this.current
      }
      return [statements, null]
    } catch (error) {
      this.current = cursor
      return [statements, this.expression()]
    }
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF
  }

  private peek(): Token {
    return this.tokens[this.current]
  }

  private previous(): Token {
    return this.tokens[this.current - 1]
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++
    return this.previous()
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false
    return this.peek().type === type
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance()
        return true
      }
    }

    return false
  }

  private consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance()

    throw this.error(this.peek(), message)
  }

  private error(token: Token, message: string): SyntaxError {
    const err =
      token.type === TokenType.EOF
        ? new SyntaxError(message, token.line, 'end')
        : new SyntaxError(message, token.line, `'${token.lexeme}'`)
    return err
  }

  private synchronize() {
    this.advance()

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.Semicolon) return

      switch (this.peek().type) {
        case TokenType.Class:
        case TokenType.Fun:
        case TokenType.Var:
        case TokenType.For:
        case TokenType.If:
        case TokenType.While:
        case TokenType.Print:
        case TokenType.Return:
          return
      }

      this.advance()
    }
  }

  private expression(): ast.Expr {
    return this.assignment()
  }

  private assignment(): ast.Expr {
    const expr = this.logicalOr()

    if (this.match(TokenType.Equal)) {
      const equals = this.previous()
      const value = this.assignment()

      if (expr instanceof ast.VariableExpr) {
        const name = expr.name
        return new ast.AssignExpr(name, value)
      }

      const error = new SyntaxError('Invalid assignment target', equals.line)
      errorReporter.report(error)
    }

    return expr
  }

  private logicalOr(): ast.Expr {
    let expr = this.logicalAnd()

    while (this.match(TokenType.Or)) {
      const operator = this.previous()
      const right = this.logicalAnd()
      expr = new ast.LogicalExpr(expr, operator, right)
    }

    return expr
  }

  private logicalAnd(): ast.Expr {
    let expr = this.equality()

    while (this.match(TokenType.And)) {
      const operator = this.previous()
      const right = this.equality()
      expr = new ast.LogicalExpr(expr, operator, right)
    }

    return expr
  }

  private equality(): ast.Expr {
    let expr = this.comparison()

    while (this.match(TokenType.BangEqual, TokenType.EqualEqual)) {
      const operator = this.previous()
      const right = this.comparison()
      expr = new ast.BinaryExpr(expr, operator, right)
    }

    return expr
  }

  private comparison(): ast.Expr {
    let expr = this.term()

    while (
      this.match(
        TokenType.Greater,
        TokenType.GreaterEqual,
        TokenType.Less,
        TokenType.LessEqual
      )
    ) {
      const operator = this.previous()
      const right = this.term()
      expr = new ast.BinaryExpr(expr, operator, right)
    }

    return expr
  }

  private term(): ast.Expr {
    let expr = this.factor()

    while (this.match(TokenType.Minus, TokenType.Plus)) {
      const operator = this.previous()
      const right = this.factor()
      expr = new ast.BinaryExpr(expr, operator, right)
    }

    return expr
  }

  private factor(): ast.Expr {
    let expr = this.unary()

    while (this.match(TokenType.Slash, TokenType.Star)) {
      const operator = this.previous()
      const right = this.unary()
      expr = new ast.BinaryExpr(expr, operator, right)
    }

    return expr
  }

  private unary(): ast.Expr {
    if (this.match(TokenType.Bang, TokenType.Minus)) {
      const operator = this.previous()
      const right = this.unary()
      return new ast.UnaryExpr(operator, right)
    }

    return this.call()
  }

  private call(): ast.Expr {
    let expr = this.primary()

    // while (true) {
    //   if (this.match(TokenType.LeftParen)) expr = this.finishCall(expr)
    //   else break
    // }

    while (this.match(TokenType.LeftParen)) expr = this.finishCall(expr)

    return expr
  }

  private finishCall(callee: ast.Expr): ast.Expr {
    const args: ast.Expr[] = []

    if (!this.check(TokenType.RightParen)) {
      do {
        if (args.length >= 255)
          errorReporter.report(
            new SyntaxError("Can't have more than 255 args", this.peek().line)
          )
        args.push(this.expression())
      } while (this.match(TokenType.Comma))
    }

    const paren = this.consume(
      TokenType.RightParen,
      "Expect ')' after arguments"
    )

    return new ast.CallExpr(callee, paren, args)
  }

  private primary(): ast.Expr {
    if (this.match(TokenType.False)) return new ast.LiteralExpr(false)
    if (this.match(TokenType.True)) return new ast.LiteralExpr(true)
    if (this.match(TokenType.Nil)) return new ast.LiteralExpr(null)

    if (this.match(TokenType.Number, TokenType.String)) {
      return new ast.LiteralExpr(this.previous().literal)
    }

    if (this.match(TokenType.Identifier)) {
      return new ast.VariableExpr(this.previous())
    }

    if (this.match(TokenType.LeftParen)) {
      const expr = this.expression()
      this.consume(TokenType.RightParen, "Expect ')' after expression")
      return new ast.GroupingExpr(expr)
    }

    throw this.error(this.peek(), 'Expect expression')
  }

  private declaration(): ast.Stmt {
    if (this.match(TokenType.Fun)) return this.funDeclaration('function')
    if (this.match(TokenType.Var)) return this.varDeclaration()

    return this.statement()
  }

  private funDeclaration(kind: 'function' | 'method') {
    const name = this.consume(TokenType.Identifier, `Expect ${kind} name`)
    this.consume(TokenType.LeftParen, `Expect '(' after ${kind} name`)

    const params: Token[] = []
    if (!this.check(TokenType.RightParen)) {
      do {
        if (params.length >= 255)
          errorReporter.report(
            new SyntaxError(
              "Can't have more than 255 parameters",
              this.peek().line
            )
          )

        params.push(this.consume(TokenType.Identifier, 'Expect parameter name'))
      } while (this.match(TokenType.Comma))
    }
    this.consume(TokenType.RightParen, "Expect ')' after parameters.")

    this.consume(TokenType.LeftBrace, `Expect '{' before ${kind} body`)
    const body = this.block()
    return new ast.FunctionStmt(name, params, body)
  }

  private varDeclaration(): ast.Stmt {
    const name = this.consume(TokenType.Identifier, 'Expect variable name')

    let initializer: ast.Expr | null = null
    if (this.match(TokenType.Equal)) initializer = this.expression()

    this.consume(TokenType.Semicolon, "Expect ';' after variable declaration")
    return new ast.VarStmt(name, initializer)
  }

  private statement(): ast.Stmt {
    if (this.match(TokenType.Print)) return this.printStatement()
    if (this.match(TokenType.Return)) return this.returnStatement()
    if (this.match(TokenType.LeftBrace)) return new ast.BlockStmt(this.block())
    if (this.match(TokenType.If)) return this.ifStatement()
    if (this.match(TokenType.While)) return this.whileStatement()
    if (this.match(TokenType.For)) return this.forStatement()

    return this.expressionStatement()
  }

  private printStatement(): ast.Stmt {
    const value = this.expression()
    this.consume(TokenType.Semicolon, "Expect ';' after value")
    return new ast.PrintStmt(value)
  }

  private expressionStatement(): ast.Stmt {
    const expr = this.expression()
    this.consume(TokenType.Semicolon, "Expect ';' after expression")
    return new ast.ExpressionStmt(expr)
  }

  private returnStatement(): ast.Stmt {
    const keyword = this.previous()
    let value = null
    if (!this.check(TokenType.Semicolon)) value = this.expression()

    this.consume(TokenType.Semicolon, "Expect ';' after return value")
    return new ast.ReturnStmt(keyword, value)
  }

  private block(): ast.Stmt[] {
    const statements: ast.Stmt[] = []

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      statements.push(this.declaration())
    }

    this.consume(TokenType.RightBrace, "Expect '}' after block")
    return statements
  }

  private ifStatement(): ast.Stmt {
    this.consume(TokenType.LeftParen, "Expect '(' after 'if'")
    const condition = this.expression()
    this.consume(TokenType.RightParen, "Expect ')' after if condition")

    const thenBranch = this.statement()
    let elseBranch = null
    if (this.match(TokenType.Else)) elseBranch = this.statement()

    return new ast.IfStmt(condition, thenBranch, elseBranch)
  }

  private whileStatement(): ast.Stmt {
    this.consume(TokenType.LeftParen, "Expect '(' after 'while'")
    const condition = this.expression()
    this.consume(TokenType.RightParen, "Expect ')' after if condition")
    const body = this.statement()

    return new ast.WhileStmt(condition, body)
  }

  private forStatement(): ast.Stmt {
    this.consume(TokenType.LeftParen, "Expect '(' after 'for'")

    let initializer
    if (this.match(TokenType.Semicolon)) {
      initializer = null
    } else if (this.match(TokenType.Var)) {
      initializer = this.varDeclaration()
    } else {
      initializer = this.expressionStatement()
    }

    let condition = null
    if (!this.check(TokenType.Semicolon)) condition = this.expression()
    this.consume(TokenType.Semicolon, "Expect ';' after loop condition")

    let increment = null
    if (!this.check(TokenType.RightParen)) increment = this.expression()
    this.consume(TokenType.RightParen, "Expect ')' after for clauses")

    let body = this.statement()

    // Desugaring
    if (increment !== null) {
      body = new ast.BlockStmt([body, new ast.ExpressionStmt(increment)])
    }
    if (condition === null) condition = new ast.LiteralExpr(true)
    body = new ast.WhileStmt(condition, body)
    if (initializer !== null) {
      body = new ast.BlockStmt([initializer, body])
    }

    return body
  }
}
