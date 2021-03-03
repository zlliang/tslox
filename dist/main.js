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
    "  tslox [--verbose]            Run tslox REPL (Add '--verbose' to show AST)\n" +
    "  tslox <script> [--verbose]   Run a specified script file (Add '--verbose' to show AST)\n" +
    '  tslox -v, --version          Show version info\n' +
    '  tslox -h, --help             Show this help message\n';
function parseArgs(args) {
    const filenameArgs = args.filter((arg) => !arg.startsWith('-'));
    if (args.length > 2 || filenameArgs.length > 1) {
        error_1.errorReporter.report(new error_1.CliError('Too much arguments'));
        console.log(usage);
        process.exit(64);
    }
    const help = args.includes('-h') || args.includes('--help');
    const version = args.includes('-v') || args.includes('--version');
    const verbose = args.includes('--verbose');
    const filename = filenameArgs[0] || null;
    return { help, version, verbose, filename };
}
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
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        console.log(usage);
        process.exit(0);
    }
    if (args.version) {
        console.log(version);
        process.exit(0);
    }
    if (args.filename !== null) {
        const runner = new runner_1.Runner('script', args.verbose);
        runFile(runner, args.filename);
    }
    else {
        const runner = new runner_1.Runner('repl', args.verbose);
        runPrompt(runner);
    }
}
main();
