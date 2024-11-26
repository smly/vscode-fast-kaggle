import * as vscode from "vscode";
import { ArticleContent } from "../schemas/article";

function getElapsedTimeFromCurrentGMTTime(published_at: string | undefined): string {
  if (published_at === undefined || published_at === "") {
    return "";
  }

  const publishedAt = new Date(published_at + " +0000");
  const currentGMTTime = new Date();
  const elapsedTime = currentGMTTime.getTime() - publishedAt.getTime();
  const elapsedSeconds = Math.floor(elapsedTime / 1000);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedDays = Math.floor(elapsedHours / 24);
  const elapsedMonths = Math.floor(elapsedDays / 30);
  const elapsedYears = Math.floor(elapsedMonths / 12);

  if (elapsedYears > 0) {
    return `${elapsedYears}y`;
  }
  if (elapsedMonths > 0) {
    return `${elapsedMonths}mo`;
  }
  if (elapsedDays > 0) {
    return `${elapsedDays}d`;
  }
  if (elapsedHours > 0) {
    return `${elapsedHours}h`;
  }
  if (elapsedMinutes > 0) {
    return `${elapsedMinutes}m`;
  }

  return `${elapsedSeconds}s`;
}


function getItemtypeColor(itemtype: string): string {
  switch (itemtype) {
    case "dataset":
      return "terminal.ansiGreen";
    case "code":
      return "terminal.ansiYellow";
    default:
      return "terminal.ansiCyan";
  }
}


export class KaggleTreeItem extends vscode.TreeItem {
  slugname: string | undefined;
  itemtype: string | undefined;

  constructor(content: ArticleContent) {
    super("", vscode.TreeItemCollapsibleState.None);

    this.iconPath = new vscode.ThemeIcon(
      "database",
      new vscode.ThemeColor(getItemtypeColor(content.itemtype))
    );
  
    this.resourceUri = content.uri;

    this.label = content.filename;
    this.slugname = content.value.slug;
    this.itemtype = content.itemtype;

    this.command = {
      command: "vscode.open",
      title: "Open Item",
      arguments: [content.uri],
    };

    this.description = getElapsedTimeFromCurrentGMTTime(content.value.published_at);
  }
}