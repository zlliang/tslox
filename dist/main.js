"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const readline_1 = require("readline");
const runner_1 = require("./runner");
const error_1 = require("./error");
const color_1 = require("./color");
const version = color_1.color.cyan('tslox v0.0.0-20210302');
const usage = '\n' +
    version +
    '\nUsage:\n\n' +
    '  tslox                  Run tslox REPL\n' +
    '  tslox [script]         Run a specified script file\n' +
    '  tslox -v, --version    Show version info\n' +
    '  tslox -h, --help       Show this help message\n';
function runFile(runner, path) {
    try {
        const source = fs_1.readFileSync(path, { encoding: 'utf-8' });
        runner.run(source);
    }
    catch (error) {
        error_1.errorReporter.report(error);
    }
    if (error_1.errorReporter.hadCliError) {
        console.log(usage);
        process.exit(64);
    }
    if (error_1.errorReporter.hadSyntaxError)
        process.exit(65);
    if (error_1.errorReporter.hadRuntimeError)
        process.exit(70);
}
function runPrompt(runner) {
    // Welcome message
    console.log('\n' + version + '\n');
    // REPL
    const rl = readline_1.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: color_1.color.cyan('[tslox]>') + ' '
    });
    rl.on('line', (line) => {
        line = line.trim();
        if (line === 'exit')
            rl.close();
        if (line) {
            try {
                runner.run(line);
            }
            catch (error) {
                error_1.errorReporter.report(error);
            }
        }
        error_1.errorReporter.hadSyntaxError = false;
        error_1.errorReporter.hadRuntimeError = false;
        console.log();
        rl.prompt();
    });
    rl.on('close', () => {
        const width = process.stdout.columns;
        console.log(`\r` + color_1.color.cyan('Bye!') + ' '.repeat(width - 4));
        process.exit(0);
    });
    rl.prompt();
}
function main() {
    const args = process.argv.slice(2);
    if (args.length > 1) {
        error_1.errorReporter.report(new error_1.CliError('Too much arguments'));
        console.log(usage);
        process.exit(64);
    }
    else if (args.length == 1) {
        if (['-v', '--version'].includes(args[0])) {
            console.log(version);
            process.exit(0);
        }
        if (['-h', '--help'].includes(args[0])) {
            console.log(usage);
            process.exit(0);
        }
        const runner = new runner_1.Runner('script');
        runFile(runner, args[0]);
    }
    else {
        const runner = new runner_1.Runner('repl');
        runPrompt(runner);
    }
}
main();
