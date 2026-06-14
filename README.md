# Code Runner

Run C, C++, Python, JavaScript, Java, Go, Rust, Ruby, and PHP code instantly. This extension provides a seamless way to execute scripts and programs either through an output panel for quick results or an integrated terminal for interactive input.

## Features

* **Instant Execution**: Run the active file with a single click or command.
* **Smart Auto-Setup**: Automatically detects if a compiler/runtime is missing and installs it via Alpine Linux (e.g., installs `openjdk17` for Java, `build-base` for C/C++) with a neat progress UI.
* **Multi-Language Support**: Supports Python, JavaScript, C, C++, Java, Go, Rust, Ruby, and PHP.
* **Run in Terminal**: Toggle between the read-only Output Panel or the Integrated Terminal to allow for user input (stdin).
* **Process Management**: Ability to kill a running process directly from the UI.
* **Output Control**: Option to clear previous output before each run and automatically save files.

## Usage

1. Open a code file in a supported language.
2. Click the **Play** icon in the editor title bar.
3. If the language compiler is not installed, Code Runner will automatically install it for you!
4. Alternatively, open the Command Palette and run the command: **Run Code**.

## Extension Settings

This extension contributes the following settings:
* `coderunner.clearPreviousOutput`: Whether to clear previous output before each run (Default: `true`).
* `coderunner.saveFileBeforeRun`: Automatically save the active file before running (Default: `true`).
* `coderunner.runInTerminal`: Whether to run code in the Integrated Terminal instead of the Output panel. Enable this if your code requires user input (Default: `false`).

## Supported Languages & Environments

* **Python**: `python3`
* **JavaScript**: `node`
* **C / C++**: `gcc` / `g++`
* **Java**: `javac` and `java`
* **Go**: `go run`
* **Rust**: `rustc`
* **Ruby**: `ruby`
* **PHP**: `php`