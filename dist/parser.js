"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const scanner_1 = require("./scanner");
const ast = __importStar(require("./ast"));
const error_1 = require("./error");
class Parser {
    constructor(tokens) {
        this.current = 0;
        this.tokens = tokens;
    }
    parse() {
        const statements = [];
        while (!this.isAtEnd()) {
            try {
                statements.push(this.declaration());
            }
            catch (error) {
                error_1.errorReporter.report(error);
                this.synchronize();
            }
        }
        return statements;
    }
    parseRepl() {
        // In REPL, users can input zero or more statements (ending with ';') and
        // maybe an expression. The interpreter execute all the statements. If there
        // is an expression, it evaluate print its value.
        let cursor = this.current;
        const statements = [];
        try {
            while (!this.isAtEnd()) {
                statements.push(this.declaration());
                cursor = this.current;
            }
            return [statements, null];
        }
        catch (error) {
            this.current = cursor;
            return [statements, this.expression()];
        }
    }
    isAtEnd() {
        return this.peek().type === scanner_1.TokenType.EOF;
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    advance() {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    }
    check(type) {
        if (this.isAtEnd())
            return false;
        return this.peek().type === type;
    }
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    consume(type, message) {
        if (this.check(type))
            return this.advance();
        throw this.error(this.peek(), message);
    }
    error(token, message) {
        const err = token.type === scanner_1.TokenType.EOF
            ? new error_1.SyntaxError(message, token.line, 'end')
            : new error_1.SyntaxError(message, token.line, `'${token.lexeme}'`);
        return err;
    }
    synchronize() {
        this.advance();
        while (!this.isAtEnd()) {
            if (this.previous().type === scanner_1.TokenType.Semicolon)
                return;
            switch (this.peek().type) {
                case scanner_1.TokenType.Class:
                case scanner_1.TokenType.Fun:
                case scanner_1.TokenType.Var:
                case scanner_1.TokenType.For:
                case scanner_1.TokenType.If:
                case scanner_1.TokenType.While:
                case scanner_1.TokenType.Print:
                case scanner_1.TokenType.Return:
                    return;
            }
            this.advance();
        }
    }
    expression() {
        return this.assignment();
    }
    assignment() {
        const expr = this.logicalOr();
        if (this.match(scanner_1.TokenType.Equal)) {
            const equals = this.previous();
            const value = this.assignment();
            if (expr instanceof ast.VariableExpr) {
                const name = expr.name;
                return new ast.AssignExpr(name, value);
            }
            const error = new error_1.SyntaxError('Invalid assignment target', equals.line);
            error_1.errorReporter.report(error);
        }
        return expr;
    }
    logicalOr() {
        let expr = this.logicalAnd();
        while (this.match(scanner_1.TokenType.Or)) {
            const operator = this.previous();
            const right = this.logicalAnd();
            expr = new ast.LogicalExpr(expr, operator, right);
        }
        return expr;
    }
    logicalAnd() {
        let expr = this.equality();
        while (this.match(scanner_1.TokenType.And)) {
            const operator = this.previous();
            const right = this.equality();
            expr = new ast.LogicalExpr(expr, operator, right);
        }
        return expr;
    }
    equality() {
        let expr = this.comparison();
        while (this.match(scanner_1.TokenType.BangEqual, scanner_1.TokenType.EqualEqual)) {
            const operator = this.previous();
            const right = this.comparison();
            expr = new ast.BinaryExpr(expr, operator, right);
        }
        return expr;
    }
    comparison() {
        let expr = this.term();
        while (this.match(scanner_1.TokenType.Greater, scanner_1.TokenType.GreaterEqual, scanner_1.TokenType.Less, scanner_1.TokenType.LessEqual)) {
            const operator = this.previous();
            const right = this.term();
            expr = new ast.BinaryExpr(expr, operator, right);
        }
        return expr;
    }
    term() {
        let expr = this.factor();
        while (this.match(scanner_1.TokenType.Minus, scanner_1.TokenType.Plus)) {
            const operator = this.previous();
            const right = this.factor();
            expr = new ast.BinaryExpr(expr, operator, right);
        }
        return expr;
    }
    factor() {
        let expr = this.unary();
        while (this.match(scanner_1.TokenType.Slash, scanner_1.TokenType.Star)) {
            const operator = this.previous();
            const right = this.unary();
            expr = new ast.BinaryExpr(expr, operator, right);
        }
        return expr;
    }
    unary() {
        if (this.match(scanner_1.TokenType.Bang, scanner_1.TokenType.Minus)) {
            const operator = this.previous();
            const right = this.unary();
            return new ast.UnaryExpr(operator, right);
        }
        return this.primary();
    }
    primary() {
        if (this.match(scanner_1.TokenType.False))
            return new ast.LiteralExpr(false);
        if (this.match(scanner_1.TokenType.True))
            return new ast.LiteralExpr(true);
        if (this.match(scanner_1.TokenType.Nil))
            return new ast.LiteralExpr(null);
        if (this.match(scanner_1.TokenType.Number, scanner_1.TokenType.String)) {
            return new ast.LiteralExpr(this.previous().literal);
        }
        if (this.match(scanner_1.TokenType.Identifier)) {
            return new ast.VariableExpr(this.previous());
        }
        if (this.match(scanner_1.TokenType.LeftParen)) {
            const expr = this.expression();
            this.consume(scanner_1.TokenType.RightParen, "Expect ')' after expression");
            return new ast.GroupingExpr(expr);
        }
        throw this.error(this.peek(), 'Expect expression');
    }
    declaration() {
        if (this.match(scanner_1.TokenType.Var))
            return this.varDeclaration();
        return this.statement();
    }
    varDeclaration() {
        const name = this.consume(scanner_1.TokenType.Identifier, 'Expect variable name');
        let initializer = null;
        if (this.match(scanner_1.TokenType.Equal))
            initializer = this.expression();
        this.consume(scanner_1.TokenType.Semicolon, "Expect ';' after variable declaration");
        return new ast.VarStmt(name, initializer);
    }
    statement() {
        if (this.match(scanner_1.TokenType.Print))
            return this.printStatement();
        if (this.match(scanner_1.TokenType.LeftBrace))
            return new ast.BlockStmt(this.block());
        if (this.match(scanner_1.TokenType.If))
            return this.ifStatement();
        if (this.match(scanner_1.TokenType.While))
            return this.whileStatement();
        if (this.match(scanner_1.TokenType.For))
            return this.forStatement();
        return this.expressionStatement();
    }
    printStatement() {
        const value = this.expression();
        this.consume(scanner_1.TokenType.Semicolon, "Expect ';' after value");
        return new ast.PrintStmt(value);
    }
    expressionStatement() {
        const expr = this.expression();
        this.consume(scanner_1.TokenType.Semicolon, "Expect ';' after expression");
        return new ast.ExpressionStmt(expr);
    }
    block() {
        const statements = [];
        while (!this.check(scanner_1.TokenType.RightBrace) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }
        this.consume(scanner_1.TokenType.RightBrace, "Expect '}' after block");
        return statements;
    }
    ifStatement() {
        this.consume(scanner_1.TokenType.LeftParen, "Expect '(' after 'if'");
        const condition = this.expression();
        this.consume(scanner_1.TokenType.RightParen, "Expect ')' after if condition");
        const thenBranch = this.statement();
        let elseBranch = null;
        if (this.match(scanner_1.TokenType.Else))
            elseBranch = this.statement();
        return new ast.IfStmt(condition, thenBranch, elseBranch);
    }
    whileStatement() {
        this.consume(scanner_1.TokenType.LeftParen, "Expect '(' after 'while'");
        const condition = this.expression();
        this.consume(scanner_1.TokenType.RightParen, "Expect ')' after if condition");
        const body = this.statement();
        return new ast.WhileStmt(condition, body);
    }
    forStatement() {
        this.consume(scanner_1.TokenType.LeftParen, "Expect '(' after 'for'");
        let initializer;
        if (this.match(scanner_1.TokenType.Semicolon)) {
            initializer = null;
        }
        else if (this.match(scanner_1.TokenType.Var)) {
            initializer = this.varDeclaration();
        }
        else {
            initializer = this.expressionStatement();
        }
        let condition = null;
        if (!this.check(scanner_1.TokenType.Semicolon))
            condition = this.expression();
        this.consume(scanner_1.TokenType.Semicolon, "Expect ';' after loop condition");
        let increment = null;
        if (!this.check(scanner_1.TokenType.RightParen))
            increment = this.expression();
        this.consume(scanner_1.TokenType.RightParen, "Expect ')' after for clauses");
        let body = this.statement();
        // Desugaring
        if (increment !== null) {
            body = new ast.BlockStmt([body, new ast.ExpressionStmt(increment)]);
        }
        if (condition === null)
            condition = new ast.LiteralExpr(true);
        body = new ast.WhileStmt(condition, body);
        if (initializer !== null) {
            body = new ast.BlockStmt([initializer, body]);
        }
        return body;
    }
}
exports.Parser = Parser;
