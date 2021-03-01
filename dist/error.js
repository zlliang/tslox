"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorReporter = exports.RuntimeError = exports.SyntaxError = exports.CliError = void 0;
const color_1 = require("./color");
class CliError extends Error {
    constructor(message) {
        super();
        this.name = 'CliError';
        this.message = message;
    }
}
exports.CliError = CliError;
class SyntaxError extends Error {
    constructor(message, line, where) {
        super();
        this.name = 'SyntaxError';
        this.message = message;
        this.line = line;
        this.where = where;
    }
}
exports.SyntaxError = SyntaxError;
class RuntimeError extends Error {
    constructor(message, token) {
        super();
        this.name = 'RuntimeError';
        this.message = message;
        this.token = token;
    }
}
exports.RuntimeError = RuntimeError;
class ErrorReporter {
    constructor() {
        this.hadCliError = false;
        this.hadSyntaxError = false;
        this.hadRuntimeError = false;
    }
    report(error) {
        let header = '';
        if (error instanceof SyntaxError && error.line) {
            header += `[${error.name} (line ${error.line}`;
            if (error.where)
                header += ` at ${error.where}`;
            header += ')';
        }
        else if (error instanceof RuntimeError) {
            header += `[${error.name} (line ${error.token.line})`;
        }
        else if (error instanceof CliError) {
            header += `[${error.name}`;
        }
        else {
            header += '[CliError';
        }
        header += ']';
        console.error(color_1.color.red(header) + ' ' + error.message);
        if (error instanceof RuntimeError)
            this.hadRuntimeError = true;
        else if (error instanceof SyntaxError)
            this.hadSyntaxError = true;
        else
            this.hadCliError = true;
    }
}
exports.errorReporter = new ErrorReporter();
