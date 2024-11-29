import * as vscode from 'vscode';
import * as child_process from 'child_process';  // eslint-disable-line
import * as path from 'path';
import * as fs from 'fs';


export function getKaggleExecutablePath(): string {
	/*
	 * 1. Check the setting value of 'fastkaggle.executablePath'
	 * 2. Check the PATH environment variable
	 */
	const extensionConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('fastkaggle');
	const settingValue: string = extensionConfig.get<string>("executablePath") || '';
	if (path.isAbsolute(settingValue) && fs.existsSync(settingValue)) {
		return settingValue;
	}

	var env = process.env['PATH'];
	if (env === undefined) {
		return '';
	}

	var paths = env.split(path.delimiter);
	for (var i = 0; i < paths.length; i++) {
		var p = path.join(paths[i], 'kaggle');
		if (path.isAbsolute(p) && fs.existsSync(p)) {
			return p;
		}
	}
	return '';
}

export function spawn(cmd: string, args: string[], outputChannel: vscode.OutputChannel): Promise<void> {
	return new Promise((resolve) => {
		// console.log(cmd, args);
        let p = child_process.spawn(cmd, args);
        let progress = 0;
		p.on('exit', (code) => {
			resolve();
		});
		p.stdout.setEncoding('utf-8');
        p.stdout.on('data', (data) => {
            if (progress > 0) {
                outputChannel.appendLine("");
                progress = 0;
            }
			outputChannel.append(new Date().toJSON() + " : " + data);
		});
        p.stderr.on('data', (data) => {
            progress += 1;
            outputChannel.append(".");
		});
	});
}

export function spawnWithStatus(cmd: string, args: string[], outputChannel: vscode.OutputChannel): Promise<boolean> {
    return new Promise((resolve) => {
		// console.log(cmd, args);
        let p = child_process.spawn(cmd, args);
        let progress = 0;
        let isRunning = false;
		p.on('exit', (code) => {
			resolve(isRunning);
		});
		p.stdout.setEncoding('utf-8');
        p.stdout.on('data', (data) => {
            if (progress > 0) {
                outputChannel.appendLine("");
                progress = 0;
            }
            if (data.includes("\"running\"")) {
                isRunning = true;
            }
			outputChannel.append(new Date().toJSON() + " : " + data);
		});
        p.stderr.on('data', (data) => {
            progress += 1;
            outputChannel.append(".");
		});
	});
}

export function spawnForExistCheck(cmd: string, args: string[], outputChannel: vscode.OutputChannel): Promise<boolean> {
    return new Promise((resolve) => {
		// console.log(cmd, args);
        let p = child_process.spawn(cmd, args);
        let progress = 0;
        let isNotExist = false;
		p.on('exit', (code) => {
			resolve(!isNotExist);
		});
		p.stdout.setEncoding('utf-8');
        p.stdout.on('data', (data) => {
            if (progress > 0) {
                outputChannel.appendLine("");
                progress = 0;
            }
            if (data.includes("403 - Forbidden")) {
                isNotExist = true;
            }
			outputChannel.append(new Date().toJSON() + " : " + data);
		});
        p.stderr.on('data', (data) => {
            progress += 1;
            outputChannel.append(".");
		});
	});
}

export function spawnToGetUsername(cmd: string, args: string[], outputChannel: vscode.OutputChannel): Promise<string> {
	// run command: kaggle config view
	// match and extract `- username: confir` stdout.

	return new Promise((resolve) => {
		let p = child_process.spawn(cmd, args);
		let progress = 0;
		let username = '';
		p.on('exit', (code) => {
			resolve(username);
		});
		p.stdout.setEncoding('utf-8');
		p.stdout.on('data', (data) => {
			if (progress > 0) {
				outputChannel.appendLine("");
				progress = 0;
			}
			let match = data.match(/- username: (.*)/);
			if (match) {
				username = match[1];
			}
			outputChannel.append(new Date().toJSON() + " : " + data);
		});
		p.stderr.on('data', (data) => {
			progress += 1;
			outputChannel.append(".");
		});
	});
}