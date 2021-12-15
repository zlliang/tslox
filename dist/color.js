"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.color = void 0;
const STDOUT_IS_TTY = process.stdout.isTTY;
const STDERR_IS_TTY = process.stderr.isTTY;
const TEXT_RED = STDERR_IS_TTY ? "\u001b[31m" : "";
const TEXT_YELLOW = STDOUT_IS_TTY ? "\u001b[33m" : "";
const TEXT_CYAN = STDOUT_IS_TTY ? "\u001b[36m" : "";
const TEXT_NORMAL = STDOUT_IS_TTY ? "\u001b[0m" : "";
const TEXT_ERROR_NORMAL = STDERR_IS_TTY ? "\u001b[0m" : "";
exports.color = {
    red: (text) => `${TEXT_RED}${text}${TEXT_ERROR_NORMAL}`,
    yellow: (text) => `${TEXT_YELLOW}${text}${TEXT_NORMAL}`,
    cyan: (text) => `${TEXT_CYAN}${text}${TEXT_NORMAL}`,
};
