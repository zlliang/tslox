"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoxInstance = exports.LoxClass = exports.LoxFunction = exports.LoxClockFunction = exports.LoxCallable = void 0;
const interpreter_1 = require("./interpreter");
const error_1 = require("./error");
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
    constructor(declaration, closure, isInitializer) {
        super();
        this.closure = closure;
        this.declaration = declaration;
        this.isInitializer = isInitializer;
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
            if (e instanceof LoxFunction.Return) {
                if (this.isInitializer)
                    return this.closure.getThis();
                else
                    return e.value;
            }
            else
                throw e; // Propagate if a real error occurs
        }
        if (this.isInitializer)
            return this.closure.getThis();
        return null;
    }
    toString() {
        return `<fun ${this.declaration.name.lexeme}>`;
    }
    bind(instance) {
        const environment = new interpreter_1.Environment(this.closure);
        environment.define('this', instance);
        return new LoxFunction(this.declaration, environment, this.isInitializer);
    }
}
exports.LoxFunction = LoxFunction;
LoxFunction.Return = class Return {
    constructor(value) {
        this.value = value;
    }
};
class LoxClass extends LoxCallable {
    constructor(name, superclass, methods) {
        super();
        this.name = name;
        this.superclass = superclass;
        this.methods = methods;
    }
    arity() {
        const initializer = this.findMethod('init');
        if (initializer === null)
            return 0;
        return initializer.arity();
    }
    call(interpreter, args) {
        const instance = new LoxInstance(this);
        const initializer = this.findMethod('init');
        if (initializer !== null)
            initializer.bind(instance).call(interpreter, args);
        return instance;
    }
    toString() {
        return `<class ${this.name}>`;
    }
    findMethod(name) {
        if (name in this.methods)
            return this.methods[name];
        if (this.superclass !== null) {
            return this.superclass.findMethod(name);
        }
        return null;
    }
}
exports.LoxClass = LoxClass;
class LoxInstance {
    constructor(klass) {
        this.fields = {};
        this.klass = klass;
    }
    get(name) {
        if (name.lexeme in this.fields)
            return this.fields[name.lexeme];
        const method = this.klass.findMethod(name.lexeme);
        if (method !== null)
            return method.bind(this);
        throw new error_1.RuntimeError(`Undefined property ${name.lexeme}`, name);
    }
    set(name, value) {
        this.fields[name.lexeme] = value;
    }
    toString() {
        return `<instance of class ${this.klass.name}>`;
    }
}
exports.LoxInstance = LoxInstance;
