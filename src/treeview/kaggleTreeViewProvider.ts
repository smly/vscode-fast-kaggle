import * as vscode from "vscode";
import { AppContext } from "../extension";
import { KaggleTreeItem } from "./kaggleTreeItem";
import { getDatasetContents, DatasetContentError } from "../schemas/datasets";
import { getModelsContents, ModelContentError } from "../schemas/models";
import { getCodesContents, CodeContentError } from "../schemas/codes";

type TreeDataProvider = vscode.TreeDataProvider<vscode.TreeItem>;

export class KaggleTreeViewProvider implements TreeDataProvider {
  private readonly context: AppContext;
  private _onDidChangeTreeData = new vscode.EventEmitter<undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  constructor(context: AppContext) {
    this.context = context;
  }

  async getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (element && element.label === "Datasets") {
      const datasetContents = await getDatasetContents(this.context);
      const treeItems = datasetContents.map((result) =>
        DatasetContentError.isError(result)
          ? new vscode.TreeItem("Failed to load kaggle datasets")
          : new KaggleTreeItem(result)
      );
      return treeItems;
    } else if (element && element.label === "Notebooks") {
      const codesContents = await getCodesContents(this.context);
      const treeItems = codesContents.map((result) =>
        CodeContentError.isError(result)
          ? new vscode.TreeItem("Failed to load kaggle notebooks")
          : new KaggleTreeItem(result)
      );
      return treeItems;
    } else if (element && element.label === "Models") {
      const modelContents = await getModelsContents(this.context);
      const treeItems = modelContents.map((modelContent) =>
        ModelContentError.isError(modelContent)
          ? new vscode.TreeItem("Failed to load kaggle models")
          : new KaggleTreeItem(modelContent)
      );
      return treeItems;
    }
    if (element) {
      return [];
    }

    return [
      new vscode.TreeItem("Datasets", vscode.TreeItemCollapsibleState.Expanded),
      new vscode.TreeItem("Notebooks", vscode.TreeItemCollapsibleState.Expanded),
      new vscode.TreeItem("Models", vscode.TreeItemCollapsibleState.Expanded),
    ];
  }
}
