import { SyntaxError } from './error'

export enum TokenType {
  // Single character tokens
  LeftParen = 'LeftParen', // '('
  RightParen = 'RightParen', // ')'
  LeftBrace = 'LeftBrace', // '{'
  RightBrace = 'RightBrace', // '}'
  Comma = 'Comma', // ','
  Dot = 'Dot', // '.'
  Minus = 'Minus', // '-'
  Plus = 'Plus', // '+'
  Semicolon = 'Semicolon', // ';'
  Slash = 'Slash', // '/'
  Star = 'Star', // '*'

  // One or two character tokens
  Bang = 'Bang', // '!'
  BangEqual = 'BangEqual', // '!='
  Equal = 'Equal', // '='
  EqualEqual = 'EqualEqual', // '=='
  Greater = 'Greater', // '>'
  GreaterEqual = 'GreaterEqual', // '>='
  Less = 'Less', // '<'
  LessEqual = 'LessEqual', // '<='

  // Literals
  Identifier = 'Identifier',
  String = 'String',
  Number = 'Number',

  // Keywords
  And = 'And',
  Class = 'Class',
  Else = 'Else',
  False = 'False',
  Fun = 'Fun',
  For = 'For',
  If = 'If',
  Nil = 'Nil',
  Or = 'Or',
  Print = 'Print',
  Return = 'Return',
  Super = 'Super',
  This = 'This',
  True = 'True',
  Var = 'Var',
  While = 'While',

  EOF = 'EOF'
}

const keywords: Record<string, TokenType> = {
  and: TokenType.And,
  class: TokenType.Class,
  else: TokenType.Else,
  false: TokenType.False,
  for: TokenType.For,
  fun: TokenType.Fun,
  if: TokenType.If,
  nil: TokenType.Nil,
  or: TokenType.Or,
  print: TokenType.Print,
  return: TokenType.Return,
  super: TokenType.Super,
  this: TokenType.This,
  true: TokenType.True,
  var: TokenType.Var,
  while: TokenType.While
}

export type LoxObject = string | number | boolean | null

export class Token {
  type: TokenType
  lexeme: string
  literal: LoxObject
  line: number

  constructor(
    type: TokenType,
    lexeme: string,
    literal: LoxObject,
    line: number
  ) {
    this.type = type
    this.lexeme = lexeme
    this.literal = literal
    this.line = line
  }

  toString(): string {
    return `${this.type} - ${this.lexeme} - ${this.literal}`
  }
}

export class Scanner {
  private source: string
  private tokens: Token[] = []
  private start = 0
  private current = 0
  private line = 1

  constructor(source: string) {
    this.source = source
  }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current
      this.scanToken()
    }

    this.tokens.push(new Token(TokenType.EOF, '', null, this.line))
    return this.tokens
  }

  private scanToken(): void {
    const c = this.advance()
    switch (c) {
      case '(':
        this.addToken(TokenType.LeftParen)
        break
      case ')':
        this.addToken(TokenType.RightParen)
        break
      case '{':
        this.addToken(TokenType.LeftBrace)
        break
      case '}':
        this.addToken(TokenType.RightBrace)
        break
      case ',':
        this.addToken(TokenType.Comma)
        break
      case '.':
        this.addToken(TokenType.Dot)
        break
      case '-':
        this.addToken(TokenType.Minus)
        break
      case '+':
        this.addToken(TokenType.Plus)
        break
      case ';':
        this.addToken(TokenType.Semicolon)
        break
      case '*':
        this.addToken(TokenType.Star)
        break
      case '!':
        this.addToken(this.match('=') ? TokenType.BangEqual : TokenType.Bang)
        break
      case '=':
        this.addToken(this.match('=') ? TokenType.EqualEqual : TokenType.Equal)
        break
      case '<':
        this.addToken(this.match('=') ? TokenType.LessEqual : TokenType.Less)
        break
      case '>':
        this.addToken(
          this.match('=') ? TokenType.GreaterEqual : TokenType.Greater
        )
        break
      case '/':
        if (this.match('/')) {
          // A comment goes until the end of the line
          while (this.peek() != '\n' && !this.isAtEnd()) this.advance()
        } else {
          this.addToken(TokenType.Slash)
        }
        break
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespaces
        break
      case '\n':
        // Line break
        this.line++
        break
      case '"':
        this.string()
        break
      default:
        if (this.isDigit(c)) this.number()
        else if (this.isAlpha(c)) this.identifier()
        else throw new SyntaxError(`Unexpected character: '${c}'`, this.line)
    }
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length
  }

  private isDigit(c: string): boolean {
    return codeOf(c) >= codeOf('0') && codeOf(c) <= codeOf('9')
  }

  private isAlpha(c: string): boolean {
    const code = codeOf(c)
    return (
      (code >= codeOf('a') && code <= codeOf('z')) ||
      (code >= codeOf('A') && code <= codeOf('Z')) ||
      code === codeOf('_')
    )
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c)
  }

  private advance(): string {
    return this.source.charAt(this.current++)
  }

  private addToken(type: TokenType, literal?: LoxObject): void {
    if (literal === undefined) literal = null
    const text = this.source.substring(this.start, this.current)
    this.tokens.push(new Token(type, text, literal, this.line))
  }

  private match(expected: string): boolean {
    if (this.isAtEnd() || this.source.charAt(this.current) != expected)
      return false
    this.current++
    return true
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0'
    return this.source.charAt(this.current)
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0'
    return this.source.charAt(this.current + 1)
  }

  private string(): void {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') this.line++
      this.advance()
    }

    if (this.isAtEnd()) throw new SyntaxError('Unterminated string', this.line)

    this.advance() // The closing '"'
    const value = this.source.substring(this.start + 1, this.current - 1) // Trim the surrounding quotes
    this.addToken(TokenType.String, value)
  }

  private number(): void {
    while (this.isDigit(this.peek())) this.advance()

    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance() // Consume the dot character
      while (this.isDigit(this.peek())) this.advance()
    }

    const value = parseFloat(this.source.substring(this.start, this.current))
    this.addToken(TokenType.Number, value)
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) this.advance()
    const text = this.source.substring(this.start, this.current)

    if (text in keywords) this.addToken(keywords[text])
    else this.addToken(TokenType.Identifier)
  }
}

function codeOf(c: string): number {
  return c.charCodeAt(0)
}
