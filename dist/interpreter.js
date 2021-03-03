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
exports.Environment = exports.Interpreter = void 0;
const types = __importStar(require("./types"));
const scanner_1 = require("./scanner");
const error_1 = require("./error");
class Interpreter {
    constructor() {
        this.globals = new Environment();
        this.environment = this.globals;
        this.locals = new Map();
        // Native function 'clock'
        this.globals.define('clock', new types.LoxClockFunction());
    }
    interpret(target) {
        if (target instanceof Array) {
            try {
                for (const stmt of target) {
                    stmt && this.execute(stmt);
                }
            }
            catch (error) {
                error_1.errorReporter.report(error);
            }
        }
        else {
            const value = this.evaluate(target);
            console.log(this.stringify(value));
        }
    }
    resolve(expr, depth) {
        this.locals.set(expr, depth);
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
    lookupVariable(name, expr) {
        const distance = this.locals.get(expr);
        if (distance !== undefined)
            return this.environment.getAt(distance, name);
        else
            return this.globals.get(name);
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
        return this.lookupVariable(expr.name, expr);
    }
    visitAssignExpr(expr) {
        const value = this.evaluate(expr.value);
        const distance = this.locals.get(expr);
        if (distance !== undefined)
            this.environment.assignAt(distance, expr.name, value);
        else
            this.globals.assign(expr.name, value);
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
        if (!(callee instanceof types.LoxCallable)) {
            throw new error_1.RuntimeError('Can only call functions and classes', expr.paren);
        }
        if (args.length !== callee.arity()) {
            throw new error_1.RuntimeError(`Expected ${callee.arity()} arguments but got ${args.length}`, expr.paren);
        }
        return callee.call(this, args);
    }
    visitGetExpr(expr) {
        const object = this.evaluate(expr.object);
        if (object instanceof types.LoxInstance)
            return object.get(expr.name);
        throw new error_1.RuntimeError('Only class instances have properties', expr.name);
    }
    visitSetExpr(expr) {
        const object = this.evaluate(expr.object);
        if (!(object instanceof types.LoxInstance))
            throw new error_1.RuntimeError('Only class instances have fields', expr.name);
        const value = this.evaluate(expr.value);
        object.set(expr.name, value);
        return value;
    }
    visitThisExpr(expr) {
        return this.lookupVariable(expr.keyword, expr);
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
        const fun = new types.LoxFunction(stmt, this.environment, false);
        this.environment.define(stmt.name.lexeme, fun);
    }
    visitReturnStmt(stmt) {
        let value = null;
        if (stmt.value !== null)
            value = this.evaluate(stmt.value);
        throw new types.LoxFunction.Return(value);
    }
    visitClassStmt(stmt) {
        this.environment.define(stmt.name.lexeme, null);
        const methods = {};
        stmt.methods.forEach((method) => {
            const fun = new types.LoxFunction(method, this.environment, method.name.lexeme === 'init');
            methods[method.name.lexeme] = fun;
        });
        const klass = new types.LoxClass(stmt.name.lexeme, methods);
        this.environment.assign(stmt.name, klass);
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
    ancestor(distance) {
        if (distance === 0)
            return this;
        else {
            let environment = this.enclosing || null;
            for (let i = 1; i < distance; i++) {
                environment = (environment === null || environment === void 0 ? void 0 : environment.enclosing) || null;
            }
            return environment;
        }
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
    assignAt(distance, name, value) {
        const environment = this.ancestor(distance);
        if (environment !== null)
            environment.values[name.lexeme] = value;
        // Unreachable (just in case)
        else
            throw new error_1.RuntimeError(`Undefined variable '${name.lexeme}'`, name);
    }
    get(name) {
        if (name.lexeme in this.values)
            return this.values[name.lexeme];
        if (this.enclosing !== null)
            return this.enclosing.get(name);
        throw new error_1.RuntimeError(`Undefined variable '${name.lexeme}'`, name);
    }
    getAt(distance, name) {
        const environment = this.ancestor(distance);
        if (environment !== null)
            return environment.values[name.lexeme];
        // Unreachable (just in case)
        throw new error_1.RuntimeError(`Undefined variable '${name.lexeme}'`, name);
    }
    getThis() {
        return this.values['this'];
    }
}
exports.Environment = Environment;
