# TSLox

An interpreter of the [Lox](https://github.com/munificent/craftinginterpreters) scripting language, implemented in TypeScript.

Lox is a tiny scripting language described in [Bob Nystrom](https://stuffwithstuff.com/)'s book [Crafting Interpreters](https://craftinginterpreters.com/). Following [Part II](https://craftinginterpreters.com/a-tree-walk-interpreter.html) of the book, I complete a tree-walk interpreter of Lox using [TypeScript](https://www.typescriptlang.org/), as a writing-an-interpreter-from-scratch exercise.

Going on reading [Part III](https://craftinginterpreters.com/a-bytecode-virtual-machine.html) of the book,
I also implement the second version of Lox interpreter using C, It is a bytecode virtual machine. See [zlliang/clox](https://github.com/zlliang/clox).

## Usage

Clone this repository, and run the CLI as:

```bash
$ pnpm tslox # Or `yarn tslox` / `npm run tslox`
```

For detailed usages, see the help message:

```
tslox v0.0.0-20211215
Usage:

  tslox [--verbose]            Run tslox REPL (Add '--verbose' to show AST)
  tslox <script> [--verbose]   Run a specified script file (Add '--verbose' to show AST)
  tslox -v, --version          Show version info
  tslox -h, --help             Show this help message
```

Also, feel free to run examples in the `examples` directory:

```
$ pnpm tslox examples/hello-world.lox
Hello, world!
```

## Features

1. **REPL that allows Lox expressions.** This is a challenge in [Chapter 8](https://craftinginterpreters.com/statements-and-state.html#challenges) of the book. In REPL mode, one can input zero or more statements (ending with '`;`') and maybe an expression. The interpreter executes all the statements. If there is an expression, the REPL evaluates and prints its value.

   ```
   [tslox]> var a = 3; a + 3
   6

   [tslox]> print a / 8;
   0.375

   [tslox]> a + 25
   28
   ```

2. **Verbose mode that prints both ASTs and outputs.** In [Chapter 5](https://craftinginterpreters.com/representing-code.html#the-visitor-pattern) of the book, a utility class [`AstPrinter`](<https://craftinginterpreters.com/representing-code.html#a-(not-very)-pretty-printer>) is created to print parsed Lox ASTs as [S-expressions](https://en.wikipedia.org/wiki/S-expression). TSLox basically adds all of the visit methods, and shows ASTs alongside script outputs, when the `--verbose` flag is enabled.

   ```
   $ pnpm tslox -- --verbose

   [tslox]> fun greet() { return "Hello, world!"; }  print greet();
   [AST]
   (fun greet
     (block
       (return "Hello, world!")))
   (print (call greet))

   [Output]
   Hello, world!
   ```

## Disclaimer

Code structures and some implementation details of TSLox are different from the original [jlox](https://github.com/munificent/craftinginterpreters/tree/master/java/com/craftinginterpreters) version. Since I read the book just for learning and exercising, I didn't write any test for TSLox. Bugs may occur. If you find one, please feel free to open an issue! :)

## Resources

- Book: [Crafting Interpreters](https://craftinginterpreters.com/)
- Blog post: [Crafting "Crafting Interpreters"](http://journal.stuffwithstuff.com/2020/04/05/crafting-crafting-interpreters/)
- Wiki: [Lox implementations](https://github.com/munificent/craftinginterpreters/wiki/Lox-implementations)
