"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Runner = void 0;
const scanner_1 = require("./scanner");
const ast_1 = require("./ast");
const parser_1 = require("./parser");
const resolver_1 = require("./resolver");
const interpreter_1 = require("./interpreter");
const error_1 = require("./error");
const color_1 = require("./color");
class Runner {
    constructor(mode, verbose) {
        this.interpreter = new interpreter_1.Interpreter();
        this.resolver = new resolver_1.Resolver(this.interpreter);
        this.mode = mode;
        this.verbose = verbose;
    }
    run(source) {
        const scanner = new scanner_1.Scanner(source);
        const tokens = scanner.scanTokens();
        const parser = new parser_1.Parser(tokens);
        if (this.mode === "script") {
            const statements = parser.parse();
            if (this.verbose) {
                const astPrinter = new ast_1.AstPrinter();
                console.log(color_1.color.yellow("[AST]"));
                console.log(astPrinter.stringify(statements));
                console.log();
            }
            if (error_1.errorReporter.hadSyntaxError)
                return;
            this.resolver.resolve(statements);
            if (error_1.errorReporter.hadSyntaxError)
                return;
            if (this.verbose)
                console.log(color_1.color.yellow("[Output]"));
            this.interpreter.interpret(statements);
        }
        else {
            const [statements, expr] = parser.parseRepl();
            if (this.verbose) {
                const astPrinter = new ast_1.AstPrinter();
                console.log(color_1.color.yellow("[AST]"));
                if (statements.length > 0)
                    console.log(astPrinter.stringify(statements));
                if (expr !== null)
                    console.log(astPrinter.stringify(expr));
                console.log();
            }
            if (error_1.errorReporter.hadSyntaxError)
                return;
            if (statements.length > 0)
                this.resolver.resolve(statements);
            if (expr !== null)
                this.resolver.resolve(expr);
            if (error_1.errorReporter.hadSyntaxError)
                return;
            if (this.verbose)
                console.log(color_1.color.yellow("[Output]"));
            if (statements.length > 0)
                this.interpreter.interpret(statements);
            if (expr !== null)
                this.interpreter.interpret(expr);
        }
    }
}
exports.Runner = Runner;
