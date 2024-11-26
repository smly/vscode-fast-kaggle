// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child_process from 'child_process'; // eslint-disable-line
import * as path from 'path';
import * as fs from 'fs';
import { KaggleTreeItem } from './treeview/kaggleTreeItem';
import { spawn, spawnWithStatus, getKaggleExecutablePath } from './command';
import { KaggleTreeViewProvider } from './treeview/kaggleTreeViewProvider';

export interface AppContext {
	extension: vscode.ExtensionContext
	articlesFolderUri: vscode.Uri;
	outputChannel: vscode.OutputChannel;
}

const clipboardSlugName = (context: vscode.ExtensionContext) => {
	return async (treeItem?: KaggleTreeItem) => {
		if (!treeItem) {
			vscode.window.showErrorMessage('No item selected');
			return;
		}

		if (typeof treeItem.slugname === 'string') {
			vscode.env.clipboard.writeText(treeItem.slugname);
		} else {
			vscode.window.showErrorMessage('Selected item label is not a string');
		}
	};
};

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
	const articlesFolderUri = vscode.Uri.file(path.join(context.extensionPath, 'articles'));
	const appContext: AppContext = {
		extension: context,
		articlesFolderUri: articlesFolderUri,
		outputChannel: outputChannel,
	};
	const kaggleTreeViewProvider = new KaggleTreeViewProvider(appContext);
	vscode.window.registerTreeDataProvider('kaggleItemView', kaggleTreeViewProvider);

	context.subscriptions.push(
		vscode.commands.registerCommand('fastkaggle.listCompetitions', () => {
			const command = `${kagglePath} competitions list`;
			outputChannel.clear();
			outputChannel.appendLine(new Date().toJSON() + " >> " + command);
			child_process.exec(command, (error, stdout, stderror) => {
				outputChannel.appendLine(stdout);
				outputChannel.appendLine(stderror);
			});
			outputChannel.show();
		}),
		vscode.commands.registerCommand('fastkaggle.updateDatasetOrCode', async () => {
			if (!vscode.window.activeTextEditor) {
				vscode.window.showErrorMessage('No active text editor');
				return;
			}

			/*
			 * TODO: check if the dataset is already created.
			 * データセットが作成されていないときは version sub-command で更新できないため、チェックが必要
			 */
			currentActivePath = vscode.window.activeTextEditor?.document.uri.fsPath;
			if (!currentActivePath || currentActivePath === undefined) {
				vscode.window.showErrorMessage('No active text editor');
				return;
			}

			await updateDatasetOrCode(currentActivePath);
		}),
		vscode.commands.registerCommand('fastkaggle.refresh', async () => {
			kaggleTreeViewProvider.refresh();
		}),
		vscode.commands.registerCommand('fastkaggle.clipboardSlugName', clipboardSlugName(context)),
		vscode.commands.registerCommand('fastkaggle.showItemStatusFromTreeView', async (treeItem: KaggleTreeItem) => {
			if (treeItem.itemtype === "model") {
				vscode.window.showErrorMessage('Model item is not supported for this command.');
				return;
			}

			if (treeItem.slugname && treeItem.itemtype) {
				await showItemStatusFromTreeView(treeItem.itemtype, treeItem.slugname);
			}
		}),
		vscode.commands.registerCommand('fastkaggle.openInBrowser', async (treeItem: KaggleTreeItem) => {
			if (treeItem.resourceUri instanceof vscode.Uri) {
				vscode.env.openExternal(treeItem.resourceUri);
			} else {
				vscode.window.showErrorMessage('Selected item url is not a string');
			}
		}),
	);

	async function showItemStatusFromTreeView(itemtype: string, slugname: string) {
		const progress = await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Check status...",
			cancellable: false
		}, async (progress, token) => {
			outputChannel.clear();
			outputChannel.show();
			if (itemtype === "dataset") {
				const command = `${kagglePath} datasets status ${slugname}`;
				outputChannel.appendLine(new Date().toJSON() + " >> " + command);
				await spawn(kagglePath, ['datasets', 'status', slugname], outputChannel);
			} else if (itemtype === "code") {
				const command = `${kagglePath} kernels status ${slugname}`;
				outputChannel.appendLine(new Date().toJSON() + " >> " + command);
				await spawn(kagglePath, ['kernels', 'status', slugname], outputChannel);
			}
		});
	}

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

	async function updateDatasetOrCode(path: string) {
		const workspaceRoot = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(path))?.uri.fsPath;
		const datasetDir = findTargetDir("dataset-metadata.json", workspaceRoot, path);
		const kernelDir = findTargetDir("kernel-metadata.json", workspaceRoot, path);
		if ((!datasetDir || datasetDir === undefined) && (!kernelDir || kernelDir === undefined)){
			vscode.window.showErrorMessage('No active text editor');
			return;
		}

		if (datasetDir && datasetDir !== undefined) {
			const progress = await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Updating dataset...",
				cancellable: false
			}, async (progress, token) => {
				outputChannel.clear();
				outputChannel.show();
				const command = `${kagglePath} datasets version -m 'update from vscode' -r zip -p ${datasetDir}`;
				outputChannel.appendLine(new Date().toJSON() + " >> " + command);
	
				await spawn(kagglePath, ['datasets', 'version', '-m', 'updae from vscode', '-r', 'zip', '-p', datasetDir], outputChannel);
			});
		} else if (kernelDir && kernelDir !== undefined) {
			const progress = await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Updating kernel...",
				cancellable: false
			}, async (progress, token) => {
				outputChannel.clear();
				outputChannel.show();
				const command = `${kagglePath} kernels push -p ${kernelDir}`;
				outputChannel.appendLine(new Date().toJSON() + " >> " + command);
				await spawn(kagglePath, ['kernels', 'push', '-p', kernelDir], outputChannel);
			});
		}
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}