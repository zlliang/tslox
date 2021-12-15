import { readFileSync } from "fs"
import { createInterface } from "readline"

import { Runner } from "./runner"
import { CliError, errorReporter } from "./error"
import { color } from "./color"

const version = color.cyan("tslox v0.0.0-20211215")

const usage =
  "\n" +
  version +
  "\nUsage:\n\n" +
  "  tslox [--verbose]            Run tslox REPL (Add '--verbose' to show AST)\n" +
  "  tslox <script> [--verbose]   Run a specified script file (Add '--verbose' to show AST)\n" +
  "  tslox -v, --version          Show version info\n" +
  "  tslox -h, --help             Show this help message\n"

type CliArgs = {
  help: boolean
  version: boolean
  verbose: boolean
  filename: string | null
}

function parseArgs(args: string[]): CliArgs {
  const filenameArgs = args.filter((arg) => !arg.startsWith("-"))

  if (args.length > 2 || filenameArgs.length > 1) {
    errorReporter.report(new CliError("Too much arguments"))
    console.log(usage)
    process.exit(64)
  }

  const help = args.includes("-h") || args.includes("--help")
  const version = args.includes("-v") || args.includes("--version")
  const verbose = args.includes("--verbose")
  const filename = filenameArgs[0] || null

  return { help, version, verbose, filename }
}

function runFile(runner: Runner, path: string): void {
  try {
    const source = readFileSync(path, { encoding: "utf-8" })
    runner.run(source)
  } catch (error) {
    errorReporter.report(error as Error)
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
  console.log("\n" + version + "\n")

  // REPL
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: color.cyan("[tslox]>") + " ",
  })

  rl.on("line", (line) => {
    line = line.trim()
    if (line === "exit") rl.close()

    if (line) {
      try {
        runner.run(line)
      } catch (error) {
        errorReporter.report(error as Error)
      }
    }
    errorReporter.hadSyntaxError = false
    errorReporter.hadRuntimeError = false

    console.log()
    rl.prompt()
  })

  rl.on("close", () => {
    const width = process.stdout.columns
    console.log(`\r` + color.cyan("Bye!") + " ".repeat(width - 4))
    process.exit(0)
  })

  rl.prompt()
}

function main(): void {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    console.log(usage)
    process.exit(0)
  }

  if (args.version) {
    console.log(version)
    process.exit(0)
  }

  if (args.filename !== null) {
    const runner = new Runner("script", args.verbose)
    runFile(runner, args.filename)
  } else {
    const runner = new Runner("repl", args.verbose)
    runPrompt(runner)
  }
}

main()
