// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child_process from 'child_process'; // eslint-disable-line
import * as path from 'path';
import * as fs from 'fs';


function getKaggleExecutablePath(): string {
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

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	var outputChannel = vscode.window.createOutputChannel("kaggle");
	const kagglePath = getKaggleExecutablePath();
	if (kagglePath === '') {
		vscode.window.showErrorMessage('kaggle executable not found');
	}
	let currentActivePath: string | undefined = undefined;

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(
		vscode.commands.registerCommand('fastkaggle.listCompetitions', () => {
			const command = `${kagglePath} competitions list`;
			outputChannel.appendLine(command);
			child_process.exec(command, (error, stdout, stderror) => {
				outputChannel.appendLine(stdout);
				outputChannel.appendLine(stderror);
			});
			outputChannel.show();
		}),
		vscode.commands.registerCommand('fastkaggle.listDatasets', () => {
			const command = `${kagglePath} datasets list -m --sort-by updated`;
			outputChannel.appendLine(command);
			child_process.exec(command, (error, stdout, stderror) => {
				outputChannel.appendLine(stdout);
				outputChannel.appendLine(stderror);
			});
			outputChannel.show();
		}),
		vscode.commands.registerCommand('fastkaggle.listKernels', () => {
			const command = `${kagglePath} kernels list -m --sort-by dateRun`;
			outputChannel.appendLine(command);
			child_process.exec(command, (error, stdout, stderror) => {
				outputChannel.appendLine(stdout);
				outputChannel.appendLine(stderror);
			});
			outputChannel.show();
		}),
		vscode.commands.registerCommand('fastkaggle.updateDataset', async () => {
			if (!vscode.window.activeTextEditor) {
				vscode.window.showErrorMessage('No active text editor');
			}
			currentActivePath = vscode.window.activeTextEditor?.document.uri.fsPath;
			await updateDataset(currentActivePath);
			outputChannel.show();
		}),
		vscode.commands.registerCommand('fastkaggle.updateKernel', async () => {
			if (!vscode.window.activeTextEditor) {
				vscode.window.showErrorMessage('No active text editor');
			}
			currentActivePath = vscode.window.activeTextEditor?.document.uri.fsPath;
			await updateKernel(currentActivePath);
			outputChannel.show();
		}),
	);

	function findTargetDir(filename: string, workspaceRoot: string | undefined, path: string): string | undefined {
		if (workspaceRoot === undefined) {
			return undefined;
		}

		const relativePath = path.replace(workspaceRoot, '');
		const dirs = relativePath.split('/');
		for (let i = dirs.length - 1; i >= 0; i--) {
			const dir = dirs.slice(0, i).join('/');
			const datasetDir = `${workspaceRoot}${dir}/${filename}`;
			if (fs.existsSync(datasetDir)) {
				return `${workspaceRoot}${dir}`;
			}
		}
		return undefined;
	}

	async function updateKernel(path: string | undefined) {
		if (!path || path === undefined) {
			vscode.window.showErrorMessage('No active text editor');
			return;
		}

		const workspaceRoot = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(path))?.uri.fsPath;
		const kernelDir = findTargetDir("kernel-metadata.json", workspaceRoot, path);
		if (kernelDir !== undefined) {
			// show progress
			const progress = await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Updating kernel...",
				cancellable: false
			}, async (progress, token) => {
				const command = `${kagglePath} kernels push -p ${kernelDir}`;
				outputChannel.appendLine("> " + command);
				child_process.exec(command, (error, stdout, stderror) => {
					outputChannel.appendLine(stdout);
					outputChannel.appendLine(stderror);
				});
			});
		}
	}

	async function updateDataset(path: string | undefined) {
		/* TODO: check if the dataset is already created. */
		if (!path || path === undefined) {
			vscode.window.showErrorMessage('No active text editor');
			return;
		}

		const workspaceRoot = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(path))?.uri.fsPath;
		const datasetDir = findTargetDir("dataset-metadata.json", workspaceRoot, path);
		if (datasetDir !== undefined) {
			// show progress
			const progress = await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Updating dataset...",
				cancellable: false
			}, async (progress, token) => {
				const command = `${kagglePath} datasets version -m 'Updae from fastkaggle' -r zip -p ${datasetDir}`;
				outputChannel.appendLine("> " + command);
				child_process.exec(command, (error, stdout, stderror) => {
					outputChannel.appendLine(stdout);
					outputChannel.appendLine(stderror);
				});
			});
		}
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
