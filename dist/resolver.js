"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resolver = void 0;
const error_1 = require("./error");
var FunctionType;
(function (FunctionType) {
    FunctionType["None"] = "None";
    FunctionType["Function"] = "Function";
    FunctionType["Initializer"] = "Initializer";
    FunctionType["Method"] = "Method";
})(FunctionType || (FunctionType = {}));
var ClassType;
(function (ClassType) {
    ClassType["None"] = "None";
    ClassType["Class"] = "Class";
    ClassType["SubClass"] = "SubClass";
})(ClassType || (ClassType = {}));
class ScopeStack extends Array {
    isEmpty() {
        return this.length < 1;
    }
    peek() {
        return this[this.length - 1];
    }
}
class Resolver {
    constructor(interpreter) {
        this.scopes = new ScopeStack();
        this.currentFunction = FunctionType.None;
        this.currentClass = ClassType.None;
        this.interpreter = interpreter;
    }
    resolve(target) {
        if (target instanceof Array)
            target.forEach((stmt) => this.resolve(stmt));
        else
            target.accept(this);
    }
    resolveLocal(expr, name) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (name.lexeme in this.scopes[i]) {
                this.interpreter.resolve(expr, this.scopes.length - 1 - i);
                return;
            }
        }
    }
    resolveFunction(fun, type) {
        const enclosingFunction = this.currentFunction;
        this.currentFunction = type;
        this.beginScope();
        fun.params.forEach((param) => {
            this.declare(param);
            this.define(param);
        });
        this.resolve(fun.body);
        this.endScope();
        this.currentFunction = enclosingFunction;
    }
    beginScope() {
        this.scopes.push({});
    }
    endScope() {
        this.scopes.pop();
    }
    declare(name) {
        if (this.scopes.isEmpty())
            return;
        const scope = this.scopes.peek();
        if (name.lexeme in scope)
            error_1.errorReporter.report(new error_1.ResolvingError("Already variable with this name in this scope", name.line));
        scope[name.lexeme] = false;
    }
    define(name) {
        if (this.scopes.isEmpty())
            return;
        const scope = this.scopes.peek();
        scope[name.lexeme] = true;
    }
    visitBinaryExpr(expr) {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }
    visitLogicalExpr(expr) {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }
    visitCallExpr(expr) {
        this.resolve(expr.callee);
        expr.args.forEach((arg) => this.resolve(arg));
    }
    visitGroupingExpr(expr) {
        this.resolve(expr.expression);
    }
    visitLiteralExpr() {
        return;
    }
    visitUnaryExpr(expr) {
        this.resolve(expr.right);
    }
    visitVariableExpr(expr) {
        if (!this.scopes.isEmpty() &&
            this.scopes.peek()[expr.name.lexeme] === false)
            error_1.errorReporter.report(new error_1.ResolvingError("Can't read local variable in its own initializer", expr.name.line));
        this.resolveLocal(expr, expr.name);
    }
    visitGetExpr(expr) {
        this.resolve(expr.object);
    }
    visitSetExpr(expr) {
        this.resolve(expr.value);
        this.resolve(expr.object);
    }
    visitThisExpr(expr) {
        if (this.currentClass === ClassType.None) {
            error_1.errorReporter.report(new error_1.ResolvingError("Can't use 'this' outside of a class", expr.keyword.line));
            return;
        }
        this.resolveLocal(expr, expr.keyword);
    }
    visitSuperExpr(expr) {
        if (this.currentClass === ClassType.None) {
            error_1.errorReporter.report(new error_1.ResolvingError("Can't use 'super' outside of class", expr.keyword.line));
        }
        else if (this.currentClass !== ClassType.SubClass) {
            error_1.errorReporter.report(new error_1.ResolvingError("Can't use 'super' in a class with no superclass", expr.keyword.line));
        }
        this.resolveLocal(expr, expr.keyword);
    }
    visitExpressionStmt(stmt) {
        this.resolve(stmt.expression);
    }
    visitIfStmt(stmt) {
        this.resolve(stmt.condition);
        this.resolve(stmt.thenBranch);
        if (stmt.elseBranch !== null)
            this.resolve(stmt.elseBranch);
    }
    visitPrintStmt(stmt) {
        this.resolve(stmt.expression);
    }
    visitReturnStmt(stmt) {
        if (this.currentFunction === FunctionType.None) {
            error_1.errorReporter.report(new error_1.ResolvingError("Can't return from top-level code", stmt.keyword.line));
        }
        if (stmt.value !== null) {
            if (this.currentFunction === FunctionType.Initializer) {
                error_1.errorReporter.report(new error_1.ResolvingError("Can't return a value from an initializer", stmt.keyword.line));
            }
            this.resolve(stmt.value);
        }
    }
    visitWhileStmt(stmt) {
        this.resolve(stmt.condition);
        this.resolve(stmt.body);
    }
    visitAssignExpr(expr) {
        this.resolve(expr.value);
        this.resolveLocal(expr, expr.name);
    }
    visitBlockStmt(stmt) {
        this.beginScope();
        this.resolve(stmt.statements);
        this.endScope();
    }
    visitVarStmt(stmt) {
        this.declare(stmt.name);
        if (stmt.initializer !== null)
            this.resolve(stmt.initializer);
        this.define(stmt.name);
    }
    visitFunctionStmt(stmt) {
        this.declare(stmt.name);
        this.define(stmt.name);
        this.resolveFunction(stmt, FunctionType.Function);
    }
    visitClassStmt(stmt) {
        const enclosingClass = this.currentClass;
        this.currentClass = ClassType.Class;
        this.declare(stmt.name);
        this.define(stmt.name);
        if (stmt.superclass !== null) {
            if (stmt.name.lexeme === stmt.superclass.name.lexeme) {
                error_1.errorReporter.report(new error_1.ResolvingError("A class can't inherit from itself.", stmt.superclass.name.line));
            }
            else {
                this.currentClass = ClassType.SubClass;
                this.resolve(stmt.superclass);
                this.beginScope();
                this.scopes.peek()["super"] = true;
            }
        }
        this.beginScope();
        this.scopes.peek()["this"] = true;
        stmt.methods.forEach((method) => {
            const declaration = method.name.lexeme === "init"
                ? FunctionType.Initializer
                : FunctionType.Method;
            this.resolveFunction(method, declaration);
        });
        this.endScope();
        if (stmt.superclass !== null)
            this.endScope();
        this.currentClass = enclosingClass;
    }
}
exports.Resolver = Resolver;
