import * as vscode from 'vscode';
import * as child_process from 'child_process'; // eslint-disable-line
import * as path from 'path';
import * as fs from 'fs';
import { KaggleTreeItem } from './treeview/kaggleTreeItem';
import { spawn, spawnForExistCheck, spawnToGetUsername, getKaggleExecutablePath } from './command';
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

const getSlugNameFromJson = (jsonPath: string): string => {
	const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
	return json['id'];
};

export function activate(context: vscode.ExtensionContext) {
	var outputChannel = vscode.window.createOutputChannel("kaggle");
	const kagglePath = getKaggleExecutablePath();
	if (kagglePath === '') {
		// Set fastkaggle.executablePath or make the kaggle command searchable in your PATH.
		vscode.window.showErrorMessage('kaggle executable not found.');
	}

	let currentActivePath: string | undefined = undefined;

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
		vscode.commands.registerCommand('fastkaggle.newDataset', async () => {
			const datasetDir = await vscode.window.showInputBox();

			// Validate input datasetDir name
			// * The title must be between 6 and 50 characters in length.
			// * Symbols are not allowed except for hyphnes.
			if (datasetDir && datasetDir.length < 6) {
				vscode.window.showErrorMessage('The title must be between 6 and 50 characters in length.');
				return;
			}
			if (datasetDir && datasetDir.length > 50) {
				vscode.window.showErrorMessage('The title must be between 6 and 50 characters in length.');
				return;
			}
			if (datasetDir && datasetDir.match(/[^a-zA-Z0-9-]/)) {
				vscode.window.showErrorMessage('Symbols are not allowed except for hyphnes.');
				return;
			}

			if (datasetDir) {
				const username = await spawnToGetUsername(kagglePath, ["config", "view"], outputChannel);
				vscode.window.showInformationMessage(`Created a new dataset: ${datasetDir}`);
				// create a new dataset `datasetDir` under the project root.
				// 1. create a `datasetDir` directory.
				// 2. write the template `dataset-metadata.json` file.
				// 3. open the `dataset-metadata.json` file.

				// todo: get username from kaggle config
				// set "id" as "<username>/<datasetDir>"
				const datasetMetadataJson = {
					"id": `${username}/${datasetDir}`,
					"title": datasetDir,
					"licenses": [
						{
							"name": "CC0-1.0"
						}
					]
				};
				const datasetMetadataJsonString = JSON.stringify(datasetMetadataJson, null, 4);
				currentActivePath = vscode.window.activeTextEditor?.document.uri.fsPath;
				if (!currentActivePath || currentActivePath === undefined) {
					vscode.window.showErrorMessage('No active text editor');
					return;
				}
	
				const workspaceRoot = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(currentActivePath))?.uri.fsPath;
				if (workspaceRoot === undefined) {
					vscode.window.showErrorMessage('No active text editor');
					return;
				}

				const datasetDirPath = `${workspaceRoot}/${datasetDir}`;
				const datasetMetadataJsonPath = path.join(datasetDirPath, 'dataset-metadata.json');
				fs.mkdirSync(datasetDirPath, { recursive: true });
				fs.writeFileSync(datasetMetadataJsonPath, datasetMetadataJsonString);
				const datasetMetadataJsonUri = vscode.Uri.file(datasetMetadataJsonPath);
				const datasetMetadataJsonDoc = await vscode.workspace.openTextDocument(datasetMetadataJsonUri);
				await vscode.window.showTextDocument(datasetMetadataJsonDoc);
			}
		}),
		vscode.commands.registerCommand('fastkaggle.newNotebook', async () => {
			const notebookDir = await vscode.window.showInputBox();

			// Validate input datasetDir name
			// * The title must be between 6 and 50 characters in length.
			// * Symbols are not allowed except for hyphnes.
			if (notebookDir && notebookDir.length < 6) {
				vscode.window.showErrorMessage('The title must be between 6 and 50 characters in length.');
				return;
			}
			if (notebookDir && notebookDir.length > 50) {
				vscode.window.showErrorMessage('The title must be between 6 and 50 characters in length.');
				return;
			}
			if (notebookDir && notebookDir.match(/[^a-zA-Z0-9-]/)) {
				vscode.window.showErrorMessage('Symbols are not allowed except for hyphnes.');
				return;
			}

			if (notebookDir) {
				const username = await spawnToGetUsername(kagglePath, ["config", "view"], outputChannel);
				vscode.window.showInformationMessage(`Created a new dataset: ${notebookDir}`);
				// create a new dataset `datasetDir` under the project root.
				// 1. create a `datasetDir` directory.
				// 2. write the template `dataset-metadata.json` file.
				// 3. open the `dataset-metadata.json` file.

				// todo: get username from kaggle config
				// set "id" as "<username>/<datasetDir>"
				const jupyterNotebookContent = {
					"cells": [
						{
							"cell_type": "code",
							"execution_count": null,
							"metadata": {},
							"outputs": [],
							"source": []
						}
					],
					"metadata": {
						"kernelspec": {
							"display_name": "Python 3",
							"language": "python",
							"name": "python3"
						},
						"language_info": {
							"name": "python",
							"version": "3.13.0"
						}
					},
					"nbformat": 4,
					"nbformat_minor": 2
				};
				const notebookMetadataJson = {
					"id": `${username}/${notebookDir}`,
					"title": notebookDir,
					"code_file": "main.ipynb",
					"language": "python",
					"kernel_type": "notebook",
					"is_private": "true",
					"enable_gpu": "true",
					"enable_tpu": "false",
					"enable_internet": "false",
					"dataset_sources": [],
					"competition_sources": [],
					"kernel_sources": [],
					"model_sources": []
				};
				const notebookMetadataJsonString = JSON.stringify(notebookMetadataJson, null, 4);
				currentActivePath = vscode.window.activeTextEditor?.document.uri.fsPath;
				if (!currentActivePath || currentActivePath === undefined) {
					vscode.window.showErrorMessage('No active text editor');
					return;
				}
	
				const workspaceRoot = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(currentActivePath))?.uri.fsPath;
				if (workspaceRoot === undefined) {
					vscode.window.showErrorMessage('No active text editor');
					return;
				}

				const notebookDirPath = `${workspaceRoot}/${notebookDir}`;
				const notebookMetadataJsonPath = path.join(notebookDirPath, 'kernel-metadata.json');
				fs.mkdirSync(notebookDirPath, { recursive: true });
				fs.writeFileSync(notebookMetadataJsonPath, notebookMetadataJsonString);

				const notebookContentString = JSON.stringify(jupyterNotebookContent, null, 4);
				const notebookContentJsonPath = path.join(notebookDirPath, 'main.ipynb');
				fs.mkdirSync(notebookDirPath, { recursive: true });
				fs.writeFileSync(notebookContentJsonPath, notebookContentString);

				const notebookMetadataJsonUri = vscode.Uri.file(notebookMetadataJsonPath);
				const notebookMetadataJsonDoc = await vscode.workspace.openTextDocument(notebookMetadataJsonUri);
				await vscode.window.showTextDocument(notebookMetadataJsonDoc);
			}
		}),
		vscode.commands.registerCommand('fastkaggle.updateDatasetOrNotebook', async () => {
			if (!vscode.window.activeTextEditor) {
				vscode.window.showErrorMessage('No active text editor');
				return;
			}
			currentActivePath = vscode.window.activeTextEditor?.document.uri.fsPath;
			if (!currentActivePath || currentActivePath === undefined) {
				vscode.window.showErrorMessage('No active text editor');
				return;
			}

			await updateDatasetOrNotebook(currentActivePath);
		}),
		vscode.commands.registerCommand('fastkaggle.getStatus', async () => {
			if (!vscode.window.activeTextEditor) {
				vscode.window.showErrorMessage('No active text editor');
				return;
			}

			currentActivePath = vscode.window.activeTextEditor?.document.uri.fsPath;
			if (!currentActivePath || currentActivePath === undefined) {
				vscode.window.showErrorMessage('No active text editor');
				return;
			}

			const workspaceRoot = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(currentActivePath))?.uri.fsPath;
			const datasetDir = findTargetDir("dataset-metadata.json", workspaceRoot, currentActivePath);
			const kernelDir = findTargetDir("kernel-metadata.json", workspaceRoot, currentActivePath);
			if ((!datasetDir || datasetDir === undefined) && (!kernelDir || kernelDir === undefined)){
				vscode.window.showErrorMessage('No active text editor');
				return;
			}

			const doc = vscode.window.activeTextEditor?.document;
			outputChannel.clear();
			outputChannel.show();
			// Return focus to the open editor
			if (doc) {
				vscode.window.showTextDocument(doc);
			}

			if (datasetDir && datasetDir !== undefined) {
				const slugName = getSlugNameFromJson(`${datasetDir}/dataset-metadata.json`);
				const command = `${kagglePath} datasets status ${slugName}`;
				outputChannel.appendLine(new Date().toJSON() + " >> " + command);
				await spawn(kagglePath, ['datasets', 'status', slugName], outputChannel);
			} else if (kernelDir && kernelDir !== undefined) {
				const slugName = getSlugNameFromJson(`${kernelDir}/kernel-metadata.json`);
				const command = `${kagglePath} kernels status ${slugName}`;
				outputChannel.appendLine(new Date().toJSON() + " >> " + command);
				await spawn(kagglePath, ['kernels', 'status', slugName], outputChannel);
			}
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

	async function updateDatasetOrNotebook(path: string) {
		const workspaceRoot = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(path))?.uri.fsPath;
		const datasetDir = findTargetDir("dataset-metadata.json", workspaceRoot, path);
		const kernelDir = findTargetDir("kernel-metadata.json", workspaceRoot, path);
		if ((!datasetDir || datasetDir === undefined) && (!kernelDir || kernelDir === undefined)){
			vscode.window.showErrorMessage('No active text editor');
			return;
		}

		const doc = vscode.window.activeTextEditor?.document;
		outputChannel.clear();
		outputChannel.show();
		// Return focus to the open editor
		if (doc) {
			vscode.window.showTextDocument(doc);
		}

		if (datasetDir && datasetDir !== undefined) {
			const progress = await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Updating dataset...",
				cancellable: false
			}, async (progress, token) => {
				const slugName = getSlugNameFromJson(`${datasetDir}/dataset-metadata.json`);
				const command = `${kagglePath} datasets status ${slugName}`;
				outputChannel.appendLine(new Date().toJSON() + " >> " + command);
				const existDataset = await spawnForExistCheck(kagglePath, ['datasets', 'status', slugName], outputChannel);
				if (!existDataset) {
					const command = `${kagglePath} datasets create -r zip -p ${datasetDir}`;
					outputChannel.appendLine(new Date().toJSON() + " >> " + command);
					await spawn(kagglePath, ['datasets', 'create', '-r', 'zip', '-p', datasetDir], outputChannel);
				} else {
					const command = `${kagglePath} datasets version -m 'update from vscode' -r zip -p ${datasetDir}`;
					outputChannel.appendLine(new Date().toJSON() + " >> " + command);
					await spawn(kagglePath, ['datasets', 'version', '-m', 'updae from vscode', '-r', 'zip', '-p', datasetDir], outputChannel);
				}
			});
		} else if (kernelDir && kernelDir !== undefined) {
			const progress = await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Updating kernel...",
				cancellable: false
			}, async (progress, token) => {
				const command = `${kagglePath} kernels push -p ${kernelDir}`;
				outputChannel.appendLine(new Date().toJSON() + " >> " + command);
				await spawn(kagglePath, ['kernels', 'push', '-p', kernelDir], outputChannel);
			});
		}
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}