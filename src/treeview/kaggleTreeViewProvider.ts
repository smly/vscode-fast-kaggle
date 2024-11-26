import * as vscode from "vscode";
import { AppContext } from "../extension";
import { KaggleTreeItem } from "./kaggleTreeItem";
import { getArticleContents, getCodesContents, getModelsContents, ArticleContentError } from "../schemas/article";

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
      const articleContents = await getArticleContents(this.context);
      const treeItems = articleContents.map((result) =>
        ArticleContentError.isError(result)
          ? new vscode.TreeItem("Failed to load kaggle datasets")
          : new KaggleTreeItem(result)
      );
      return treeItems;
    } else if (element && element.label === "Codes") {
      const codesContents = await getCodesContents(this.context);
      const treeItems = codesContents.map((result) =>
        ArticleContentError.isError(result)
          ? new vscode.TreeItem("Failed to load kaggle codes")
          : new KaggleTreeItem(result)
      );
      return treeItems;
    } else if (element && element.label === "Models") {
      const codesContents = await getModelsContents(this.context);
      const treeItems = codesContents.map((result) =>
        ArticleContentError.isError(result)
          ? new vscode.TreeItem("Failed to load kaggle models")
          : new KaggleTreeItem(result)
      );
      return treeItems;
    }
    if (element) {
      return [];
    }

    return [
      new vscode.TreeItem("Datasets", vscode.TreeItemCollapsibleState.Expanded),
      new vscode.TreeItem("Codes", vscode.TreeItemCollapsibleState.Expanded),
      new vscode.TreeItem("Models", vscode.TreeItemCollapsibleState.Expanded),
    ];
  }
}
