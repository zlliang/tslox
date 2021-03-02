import { readFileSync } from 'fs'
import { createInterface } from 'readline'

import { Runner } from './runner'
import { CliError, errorReporter } from './error'
import { color } from './color'

const version = color.cyan('tslox v0.0.0-20210302')

const usage =
  '\n' +
  version +
  '\nUsage:\n\n' +
  '  tslox                  Run tslox REPL\n' +
  '  tslox [script]         Run a specified script file\n' +
  '  tslox -v, --version    Show version info\n' +
  '  tslox -h, --help       Show this help message\n'

function runFile(runner: Runner, path: string): void {
  try {
    const source = readFileSync(path, { encoding: 'utf-8' })
    runner.run(source)
  } catch (error) {
    errorReporter.report(error)
  }

  if (errorReporter.hadCliError) {
    console.log(usage)
    process.exit(64)
  }
  if (errorReporter.hadSyntaxError) process.exit(65)
  if (errorReporter.hadRuntimeError) process.exit(70)
}

function runPrompt(runner: Runner): void {
  // Welcome message
  console.log('\n' + version + '\n')

  // REPL
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: color.cyan('[tslox]>') + ' '
  })

  rl.on('line', (line) => {
    line = line.trim()
    if (line === 'exit') rl.close()

    if (line) {
      try {
        runner.run(line)
      } catch (error) {
        errorReporter.report(error)
      }
    }
    errorReporter.hadSyntaxError = false
    errorReporter.hadRuntimeError = false

    console.log()
    rl.prompt()
  })

  rl.on('close', () => {
    const width = process.stdout.columns
    console.log(`\r` + color.cyan('Bye!') + ' '.repeat(width - 4))
    process.exit(0)
  })

  rl.prompt()
}

function main(): void {
  const args = process.argv.slice(2)

  if (args.length > 1) {
    errorReporter.report(new CliError('Too much arguments'))
    console.log(usage)
    process.exit(64)
  } else if (args.length == 1) {
    if (['-v', '--version'].includes(args[0])) {
      console.log(version)
      process.exit(0)
    }
    if (['-h', '--help'].includes(args[0])) {
      console.log(usage)
      process.exit(0)
    }

    const runner = new Runner('script')
    runFile(runner, args[0])
  } else {
    const runner = new Runner('repl')
    runPrompt(runner)
  }
}

main()
