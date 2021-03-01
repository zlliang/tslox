"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scanner = exports.Token = exports.TokenType = void 0;
const error_1 = require("./error");
var TokenType;
(function (TokenType) {
    // Single character tokens
    TokenType["LeftParen"] = "LeftParen";
    TokenType["RightParen"] = "RightParen";
    TokenType["LeftBrace"] = "LeftBrace";
    TokenType["RightBrace"] = "RightBrace";
    TokenType["Comma"] = "Comma";
    TokenType["Dot"] = "Dot";
    TokenType["Minus"] = "Minus";
    TokenType["Plus"] = "Plus";
    TokenType["Semicolon"] = "Semicolon";
    TokenType["Slash"] = "Slash";
    TokenType["Star"] = "Star";
    // One or two character tokens
    TokenType["Bang"] = "Bang";
    TokenType["BangEqual"] = "BangEqual";
    TokenType["Equal"] = "Equal";
    TokenType["EqualEqual"] = "EqualEqual";
    TokenType["Greater"] = "Greater";
    TokenType["GreaterEqual"] = "GreaterEqual";
    TokenType["Less"] = "Less";
    TokenType["LessEqual"] = "LessEqual";
    // Literals
    TokenType["Identifier"] = "Identifier";
    TokenType["String"] = "String";
    TokenType["Number"] = "Number";
    // Keywords
    TokenType["And"] = "And";
    TokenType["Class"] = "Class";
    TokenType["Else"] = "Else";
    TokenType["False"] = "False";
    TokenType["Fun"] = "Fun";
    TokenType["For"] = "For";
    TokenType["If"] = "If";
    TokenType["Nil"] = "Nil";
    TokenType["Or"] = "Or";
    TokenType["Print"] = "Print";
    TokenType["Return"] = "Return";
    TokenType["Super"] = "Super";
    TokenType["This"] = "This";
    TokenType["True"] = "True";
    TokenType["Var"] = "Var";
    TokenType["While"] = "While";
    TokenType["EOF"] = "EOF";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
const keywords = {
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
};
class Token {
    constructor(type, lexeme, literal, line) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
    }
    toString() {
        return `${this.type} - ${this.lexeme} - ${this.literal}`;
    }
}
exports.Token = Token;
class Scanner {
    constructor(source) {
        this.tokens = [];
        this.start = 0;
        this.current = 0;
        this.line = 1;
        this.source = source;
    }
    scanTokens() {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }
        this.tokens.push(new Token(TokenType.EOF, '', null, this.line));
        return this.tokens;
    }
    scanToken() {
        const c = this.advance();
        switch (c) {
            case '(':
                this.addToken(TokenType.LeftParen);
                break;
            case ')':
                this.addToken(TokenType.RightParen);
                break;
            case '{':
                this.addToken(TokenType.LeftBrace);
                break;
            case '}':
                this.addToken(TokenType.RightBrace);
                break;
            case ',':
                this.addToken(TokenType.Comma);
                break;
            case '.':
                this.addToken(TokenType.Dot);
                break;
            case '-':
                this.addToken(TokenType.Minus);
                break;
            case '+':
                this.addToken(TokenType.Plus);
                break;
            case ';':
                this.addToken(TokenType.Semicolon);
                break;
            case '*':
                this.addToken(TokenType.Star);
                break;
            case '!':
                this.addToken(this.match('=') ? TokenType.BangEqual : TokenType.Bang);
                break;
            case '=':
                this.addToken(this.match('=') ? TokenType.EqualEqual : TokenType.Equal);
                break;
            case '<':
                this.addToken(this.match('=') ? TokenType.LessEqual : TokenType.Less);
                break;
            case '>':
                this.addToken(this.match('=') ? TokenType.GreaterEqual : TokenType.Greater);
                break;
            case '/':
                if (this.match('/')) {
                    // A comment goes until the end of the line
                    while (this.peek() != '\n' && !this.isAtEnd())
                        this.advance();
                }
                else {
                    this.addToken(TokenType.Slash);
                }
                break;
            case ' ':
            case '\r':
            case '\t':
                // Ignore whitespaces
                break;
            case '\n':
                // Line break
                this.line++;
                break;
            case '"':
                this.string();
                break;
            default:
                if (this.isDigit(c))
                    this.number();
                else if (this.isAlpha(c))
                    this.identifier();
                else
                    throw new error_1.SyntaxError(`Unexpected character: '${c}'`, this.line);
        }
    }
    isAtEnd() {
        return this.current >= this.source.length;
    }
    isDigit(c) {
        return codeOf(c) >= codeOf('0') && codeOf(c) <= codeOf('9');
    }
    isAlpha(c) {
        const code = codeOf(c);
        return ((code >= codeOf('a') && code <= codeOf('z')) ||
            (code >= codeOf('A') && code <= codeOf('Z')) ||
            code === codeOf('_'));
    }
    isAlphaNumeric(c) {
        return this.isAlpha(c) || this.isDigit(c);
    }
    advance() {
        return this.source.charAt(this.current++);
    }
    addToken(type, literal) {
        if (literal === undefined)
            literal = null;
        const text = this.source.substring(this.start, this.current);
        this.tokens.push(new Token(type, text, literal, this.line));
    }
    match(expected) {
        if (this.isAtEnd() || this.source.charAt(this.current) != expected)
            return false;
        this.current++;
        return true;
    }
    peek() {
        if (this.isAtEnd())
            return '\0';
        return this.source.charAt(this.current);
    }
    peekNext() {
        if (this.current + 1 >= this.source.length)
            return '\0';
        return this.source.charAt(this.current + 1);
    }
    string() {
        while (this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() === '\n')
                this.line++;
            this.advance();
        }
        if (this.isAtEnd())
            throw new error_1.SyntaxError('Unterminated string', this.line);
        this.advance(); // The closing '"'
        const value = this.source.substring(this.start + 1, this.current - 1); // Trim the surrounding quotes
        this.addToken(TokenType.String, value);
    }
    number() {
        while (this.isDigit(this.peek()))
            this.advance();
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            this.advance(); // Consume the dot character
            while (this.isDigit(this.peek()))
                this.advance();
        }
        const value = parseFloat(this.source.substring(this.start, this.current));
        this.addToken(TokenType.Number, value);
    }
    identifier() {
        while (this.isAlphaNumeric(this.peek()))
            this.advance();
        const text = this.source.substring(this.start, this.current);
        if (text in keywords)
            this.addToken(keywords[text]);
        else
            this.addToken(TokenType.Identifier);
    }
}
exports.Scanner = Scanner;
function codeOf(c) {
    return c.charCodeAt(0);
}
