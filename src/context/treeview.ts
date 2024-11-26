import * as vscode from "vscode";
import { AppContext } from "../extension";
import { KaggleTreeViewProvider } from "../treeview/kaggleTreeViewProvider";

export const initializeTreeView = (context: AppContext): vscode.Disposable[] => {
  const articlesTreeViewProvider = new KaggleTreeViewProvider(context);

  return [
    vscode.window.createTreeView("kaggleItemView", {
      treeDataProvider: articlesTreeViewProvider,
    }),
  ];
};