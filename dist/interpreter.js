"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = exports.Interpreter = void 0;
const types_1 = require("./types");
const scanner_1 = require("./scanner");
const error_1 = require("./error");
class Interpreter {
    constructor() {
        this.globals = new Environment();
        this.environment = this.globals;
        // Native function 'clock'
        this.globals.define('clock', new types_1.LoxClockFunction());
    }
    interpret(statements) {
        try {
            for (const stmt of statements) {
                stmt && this.execute(stmt);
            }
        }
        catch (error) {
            error_1.errorReporter.report(error);
        }
    }
    interpretExpr(expr) {
        const value = this.evaluate(expr);
        console.log(this.stringify(value));
    }
    evaluate(expr) {
        return expr.accept(this);
    }
    execute(stmt) {
        stmt.accept(this);
    }
    executeBlock(statements, environment) {
        const previousEnvironment = this.environment;
        try {
            this.environment = environment;
            for (const stmt of statements) {
                stmt && this.execute(stmt);
            }
        }
        finally {
            this.environment = previousEnvironment;
        }
    }
    stringify(object) {
        if (object === null)
            return 'nil';
        if (typeof object === 'number') {
            let text = object.toString();
            if (text.endsWith('.0'))
                text = text.substring(0, text.length - 2);
            return text;
        }
        return object.toString();
    }
    isTruthy(object) {
        if (object === null)
            return false;
        if (typeof object === 'boolean')
            return object;
        return true;
    }
    isEqual(a, b) {
        if (a === null && b === null)
            return true;
        if (a === null)
            return false;
        return a === b;
    }
    checkNumberOperand(token, operand) {
        if (typeof operand === 'number')
            return;
        else
            throw new error_1.RuntimeError('Operand must be a number', token);
    }
    checkNumberOperands(token, left, right) {
        if (typeof left === 'number' && typeof right === 'number')
            return;
        else
            throw new error_1.RuntimeError('Operands must be numbers', token);
    }
    visitBinaryExpr(expr) {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case scanner_1.TokenType.Greater:
                this.checkNumberOperands(expr.operator, left, right);
                return left > right;
            case scanner_1.TokenType.GreaterEqual:
                this.checkNumberOperands(expr.operator, left, right);
                return left >= right;
            case scanner_1.TokenType.Less:
                this.checkNumberOperands(expr.operator, left, right);
                return left < right;
            case scanner_1.TokenType.LessEqual:
                this.checkNumberOperands(expr.operator, left, right);
                return left <= right;
            case scanner_1.TokenType.Minus:
                this.checkNumberOperands(expr.operator, left, right);
                return left - right;
            case scanner_1.TokenType.BangEqual:
                return !this.isEqual(left, right);
            case scanner_1.TokenType.EqualEqual:
                return this.isEqual(left, right);
            case scanner_1.TokenType.Slash:
                this.checkNumberOperands(expr.operator, left, right);
                return left / right;
            case scanner_1.TokenType.Star:
                this.checkNumberOperands(expr.operator, left, right);
                return left * right;
            case scanner_1.TokenType.Plus:
                if (typeof left === 'number' && typeof right === 'number') {
                    return left + right;
                }
                if (typeof left === 'string' && typeof right === 'string') {
                    return left + right;
                }
                throw new error_1.RuntimeError('Operands must be two numbers or two strings', expr.operator);
        }
        // Unreachable
        return null;
    }
    visitGroupingExpr(expr) {
        return this.evaluate(expr.expression);
    }
    visitLiteralExpr(expr) {
        return expr.value;
    }
    visitUnaryExpr(expr) {
        const right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case scanner_1.TokenType.Bang:
                return !this.isTruthy(right);
            case scanner_1.TokenType.Minus:
                this.checkNumberOperand(expr.operator, right);
                return -right;
        }
        // Unreachable
        return null;
    }
    visitVariableExpr(expr) {
        return this.environment.get(expr.name);
    }
    visitAssignExpr(expr) {
        const value = this.evaluate(expr.value);
        this.environment.assign(expr.name, value);
        return value;
    }
    visitLogicalExpr(expr) {
        const left = this.evaluate(expr.left);
        if (expr.operator.type === scanner_1.TokenType.Or) {
            if (this.isTruthy(left))
                return left;
        }
        else {
            if (!this.isTruthy(left))
                return left;
        }
        return this.evaluate(expr.right);
    }
    visitCallExpr(expr) {
        const callee = this.evaluate(expr.callee);
        const args = expr.args.map((arg) => this.evaluate(arg));
        if (!(callee instanceof types_1.LoxCallable)) {
            throw new error_1.RuntimeError('Can only call functions and classes', expr.paren);
        }
        if (args.length !== callee.arity()) {
            throw new error_1.RuntimeError(`Expected ${callee.arity()} arguments but got ${args.length}`, expr.paren);
        }
        return callee.call(this, args);
    }
    visitExpressionStmt(stmt) {
        this.evaluate(stmt.expression);
    }
    visitPrintStmt(stmt) {
        const value = this.evaluate(stmt.expression);
        console.log(this.stringify(value));
    }
    visitVarStmt(stmt) {
        let value = null;
        if (stmt.initializer !== null)
            value = this.evaluate(stmt.initializer);
        this.environment.define(stmt.name.lexeme, value);
    }
    visitBlockStmt(stmt) {
        this.executeBlock(stmt.statements, new Environment(this.environment));
    }
    visitIfStmt(stmt) {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        }
        else if (stmt.elseBranch !== null) {
            this.execute(stmt.elseBranch);
        }
    }
    visitWhileStmt(stmt) {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body);
        }
    }
    visitFunctionStmt(stmt) {
        const fun = new types_1.LoxFunction(stmt, this.environment);
        this.environment.define(stmt.name.lexeme, fun);
    }
    visitReturnStmt(stmt) {
        let value = null;
        if (stmt.value !== null)
            value = this.evaluate(stmt.value);
        throw new types_1.LoxFunction.Return(value);
    }
}
exports.Interpreter = Interpreter;
class Environment {
    constructor(enclosing) {
        this.values = {};
        if (enclosing)
            this.enclosing = enclosing;
        else
            this.enclosing = null;
    }
    define(name, value) {
        this.values[name] = value;
    }
    assign(name, value) {
        if (name.lexeme in this.values) {
            this.values[name.lexeme] = value;
            return;
        }
        if (this.enclosing !== null) {
            this.enclosing.assign(name, value);
            return;
        }
        throw new error_1.RuntimeError(`Undefined variable '${name.lexeme}'`, name);
    }
    get(name) {
        if (name.lexeme in this.values)
            return this.values[name.lexeme];
        if (this.enclosing !== null)
            return this.enclosing.get(name);
        throw new error_1.RuntimeError(`Undefined variable '${name.lexeme}'`, name);
    }
}
exports.Environment = Environment;
