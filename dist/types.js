"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoxFunction = exports.LoxClockFunction = exports.LoxCallable = void 0;
const interpreter_1 = require("./interpreter");
class LoxCallable {
}
exports.LoxCallable = LoxCallable;
class LoxClockFunction extends LoxCallable {
    arity() {
        return 0;
    }
    call() {
        return Date.now().valueOf() / 1000.0;
    }
    toString() {
        return "<native fun 'clock'>";
    }
}
exports.LoxClockFunction = LoxClockFunction;
class LoxFunction extends LoxCallable {
    constructor(declaration, closure) {
        super();
        this.closure = closure;
        this.declaration = declaration;
    }
    arity() {
        return this.declaration.params.length;
    }
    call(interpreter, args) {
        const environment = new interpreter_1.Environment(this.closure);
        for (const [i, param] of this.declaration.params.entries()) {
            environment.define(param.lexeme, args[i]);
        }
        try {
            interpreter.executeBlock(this.declaration.body, environment);
        }
        catch (e) {
            if (e instanceof LoxFunction.Return)
                return e.value;
            else
                throw e;
        }
        return null;
    }
    toString() {
        return `<fun ${this.declaration.name.lexeme}>`;
    }
}
exports.LoxFunction = LoxFunction;
LoxFunction.Return = class Return {
    constructor(value) {
        this.value = value;
    }
};
