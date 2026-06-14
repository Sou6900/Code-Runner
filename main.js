// src/main.js
import { window, workspace, commands, tasks, menus } from '@mscode/api';

const ongoingInstallations = new Map();

export function activate(context) {
    console.log("[Code Runner] Successfully Activated!");

    const channels = {};

    function getOutputChannel(langId) {
        const channelName = `Code Runner: ${langId.toUpperCase()}`;
        if (!channels[channelName]) {
            const newChannel = window.createOutputChannel(channelName);
            channels[channelName] = newChannel;
            context.subscriptions.push(newChannel);
        }
        return channels[channelName];
    }

    const LANG_CONFIG = {
        'python':     { checkCmd: 'python3 --version', installCmd: 'apk update && apk add --no-cache python3', runCmd: (ctx) => `python3 -u "${ctx.filePath}"`, pkgName: 'Python 3' },
        'javascript': { checkCmd: 'node --version', installCmd: 'apk update && apk add --no-cache nodejs', runCmd: (ctx) => `node "${ctx.filePath}"`, pkgName: 'Node.js' },
        'c': { checkCmd: 'gcc --version', installCmd: 'apk update && apk add --no-cache build-base', runCmd: (ctx) => `cd "${ctx.dir}" && gcc *.c -o "/tmp/a.out" && /tmp/a.out`, pkgName: 'C Compiler (gcc)' },
        'cpp': { checkCmd: 'g++ --version', installCmd: 'apk update && apk add --no-cache build-base', runCmd: (ctx) => `cd "${ctx.dir}" && g++ *.cpp -o "/tmp/a.out" && /tmp/a.out`, pkgName: 'C++ Compiler (g++)' },
        'java':       { checkCmd: 'javac -version', installCmd: 'apk update && apk add --no-cache openjdk17', runCmd: (ctx) => `cd "${ctx.dir}" && javac "${ctx.fileName}" && java "${ctx.fileNameNoExt}"`, pkgName: 'Java (OpenJDK 17)' },
        'go':         { checkCmd: 'go version', installCmd: 'apk update && apk add --no-cache go', runCmd: (ctx) => `cd "${ctx.dir}" && go run "${ctx.fileName}"`, pkgName: 'Go Compiler' },
        'rust':       { checkCmd: 'rustc --version', installCmd: 'apk update && apk add --no-cache rust cargo', runCmd: (ctx) => `cd "${ctx.dir}" && rustc "${ctx.fileName}" -o "/tmp/rust_out" && /tmp/rust_out`, pkgName: 'Rust Compiler' },
        'ruby':       { checkCmd: 'ruby --version', installCmd: 'apk update && apk add --no-cache ruby', runCmd: (ctx) => `ruby "${ctx.filePath}"`, pkgName: 'Ruby' },
        'php':        { checkCmd: 'php --version', installCmd: 'apk update && apk add --no-cache php', runCmd: (ctx) => `php "${ctx.filePath}"`, pkgName: 'PHP' }
    };
    
    LANG_CONFIG['py'] = LANG_CONFIG['python'];
    LANG_CONFIG['js'] = LANG_CONFIG['javascript'];
    LANG_CONFIG['rs'] = LANG_CONFIG['rust'];
    LANG_CONFIG['rb'] = LANG_CONFIG['ruby'];

    async function ensureEnvironment(langId) {
        const config = LANG_CONFIG[langId];
        if (!config) return false;

        if (ongoingInstallations.has(langId)) {
            console.log(`[Code Runner] Setup for ${langId} is already in progress. Waiting...`);
            return ongoingInstallations.get(langId);
        }

        const setupPromise = new Promise(async (resolve) => {
            try {
                const checkTask = tasks.execute(config.checkCmd, '', () => {});
                const checkResult = await checkTask.result;
                
                if (checkResult && checkResult.exitCode === 0) {
                    return resolve(true);
                }

                const setupOut = getOutputChannel('SETUP');
                setupOut.show();
                setupOut.clear();
                setupOut.appendLine(`[System] Dependency check failed. ${config.pkgName} is missing.`);
                setupOut.appendLine(`[Running] ${config.installCmd}\n`);

                const progress = window.withProgress(
                    `Setting up ${config.pkgName}...`, 
                    `Check "Code Runner: SETUP" output panel for details.`
                );
                
                const installTask = tasks.execute(config.installCmd, '', (data) => {
                    setupOut.append(data);
                });
                
                setupOut.onDidKill(() => {
                    installTask.kill();
                    setupOut.appendLine(`\n[🛑 Killed] Setup cancelled by user.`);
                });

                const installResult = await installTask.result;
                setupOut.clearKillHandler();
                
                if (installResult && installResult.exitCode === 0) {
                    progress.done(`${config.pkgName} installed!`);
                    setupOut.appendLine(`\n[✅ Done] ${config.pkgName} setup completed successfully!`);
                    resolve(true);
                } else {
                    progress.error(`Setup Failed`);
                    setupOut.appendLine(`\n[❌ Error] Installation failed with exit code ${installResult ? installResult.exitCode : 'Unknown'}.`);
                    window.showErrorMessage(`Failed to install ${config.pkgName}. Check Output panel.`);
                    resolve(false);
                }
            } catch (err) {
                console.error(`[Code Runner] Environment setup error:`, err);
                resolve(false);
            } finally {
                ongoingInstallations.delete(langId);
            }
        });

        ongoingInstallations.set(langId, setupPromise);

        return setupPromise;
    }

    const executeCode = async () => {
        const editor = window.activeTextEditor;
        if (!editor) return window.showErrorMessage("No active file to run.");

        const fileUri = editor.document.uri;
        const langId = editor.document.languageId.toLowerCase();
        const filePath = fileUri.replace('file://', '');
        
        const pathParts = filePath.split('/');
        const fileName = pathParts.pop();
        const dir = pathParts.join('/');
        const fileNameNoExt = fileName.split('.').slice(0, -1).join('.') || fileName;

        if (!LANG_CONFIG[langId]) {
            return window.showErrorMessage(`Language '${langId}' not supported by Code Runner.`);
        }

        const configSettings = workspace.getConfiguration('coderunner');
        const clearPrev = configSettings.get('clearPreviousOutput', true);
        const runInTerminal = configSettings.get('runInTerminal', false);
        const saveBeforeRun = configSettings.get('saveFileBeforeRun', true);

        if (saveBeforeRun) {
            try { await commands.executeCommand('workbench.action.files.save'); } 
            catch (err) {}
        }
        
        const isReady = await ensureEnvironment(langId);
        if (!isReady) return;

        const cmd = LANG_CONFIG[langId].runCmd({ filePath, dir, fileName, fileNameNoExt });

        if (runInTerminal) {
            const termName = `Code Runner`;
            const terminalAPI = window; 
            
            let terminal = terminalAPI.terminals?.find(t => t.name === termName);
            if (!terminal) {
                terminal = terminalAPI.createTerminal({ name: termName });
            }
            
            terminal.show(); 
            const finalCmd = clearPrev ? `clear && ${cmd}` : cmd;
            terminal.sendText(finalCmd); 
            return;
        }

        const out = getOutputChannel(langId);
        out.show();
        if (clearPrev) out.clear();

        out.appendLine(`[Running] ${cmd}`);
        const startTime = Date.now();

        const task = tasks.execute(cmd, '', (data) => {
            out.append(data);
        });

        out.onDidKill(() => {
            task.kill();
            out.appendLine(`\n[Process Killed by User]`);
        });

        const { exitCode } = await task.result;
        out.clearKillHandler();

        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(3);
        out.appendLine(`\n[Done] exited with code=${exitCode} in ${timeTaken} seconds`);
    };

    // ─── COMMAND REGISTRATION ───
    commands.registerCommand('coderunner.run', executeCode);

    // ─── MENU REGISTRATION ───
    const supportedLangs = "editorLangId == python || editorLangId == py || editorLangId == javascript || editorLangId == js || editorLangId == c || editorLangId == cpp || editorLangId == java || editorLangId == go || editorLangId == rust || editorLangId == rs || editorLangId == ruby || editorLangId == rb || editorLangId == php";

    const runMenu = menus.registerItem('editor/title', {
        id: 'coderunner.run-btn', // anchor
        label: 'Run Code',   
        icon: 'play',         
        order: -1000, 
        when: supportedLangs,
        children: [
            {
                id: 'coderunner.run-action',
                label: 'Run with Code Runner',
                icon: 'play', 
                order: 1,
                onClick: () => commands.executeCommand('coderunner.run')
            }
        ]
    });
    
    context.subscriptions.push(runMenu);
}

export function deactivate() {
    console.log("🛑 [Code Runner] Shutting down. Cleanup done!");
}