import * as vscode from "vscode";
import { AppContext } from "../extension";
import { KaggleTreeViewProvider } from "../treeview/kaggleTreeViewProvider";

export const initializeTreeView = (context: AppContext): vscode.Disposable[] => {
  const treeViewProvider = new KaggleTreeViewProvider(context);

  return [
    vscode.window.createTreeView("kaggleItemView", {
      treeDataProvider: treeViewProvider,
    }),
  ];
};