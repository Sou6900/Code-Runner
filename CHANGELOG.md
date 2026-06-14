# Changelog

All notable changes to the "Code Runner" extension will be documented in this file.

## 1.0.4
### 
* **C & Cpp Multifile run fix**
* **Exit Code 99 Fix**

## 1.0.1
### Major Feature Update
* **Added Smart Auto-Setup**: Code Runner now automatically checks if the required compiler or runtime is installed. If not, it seamlessly downloads and installs the necessary Alpine Linux packages (with a progress notification) before running the code!
* **Expanded Language Support**: Added native execution support for Java, Go, Rust, Ruby, and PHP.
* **Smart Context Execution**: Java execution now automatically navigates to the correct directory to compile and run classes seamlessly.

## 1.0.0
### Initial Release
* Added support for C, C++, Python, and JavaScript.
* Implemented Integrated Terminal support for interactive code execution.
* Added Output Channel for background tasks with process termination capabilities.
* Integrated editor title bar menu for quick access.
* Added configuration settings for output clearing, file saving, and terminal toggling.