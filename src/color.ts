const STDOUT_IS_TTY = process.stdout.isTTY
const STDERR_IS_TTY = process.stderr.isTTY
const TEXT_RED = STDERR_IS_TTY ? "\u001b[31m" : ""
const TEXT_YELLOW = STDOUT_IS_TTY ? "\u001b[33m" : ""
const TEXT_CYAN = STDOUT_IS_TTY ? "\u001b[36m" : ""
const TEXT_NORMAL = STDOUT_IS_TTY ? "\u001b[0m" : ""
const TEXT_ERROR_NORMAL = STDERR_IS_TTY ? "\u001b[0m" : ""

type TextDecoration = (text: string) => string

export const color: Record<string, TextDecoration> = {
  red: (text: string) => `${TEXT_RED}${text}${TEXT_ERROR_NORMAL}`,
  yellow: (text: string) => `${TEXT_YELLOW}${text}${TEXT_NORMAL}`,
  cyan: (text: string) => `${TEXT_CYAN}${text}${TEXT_NORMAL}`,
}
