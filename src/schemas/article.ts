import * as vscode from "vscode";
import { AppContext } from "../extension";
import { getKaggleExecutablePath } from "../command";
import * as child_process from 'child_process';  // eslint-disable-line


export interface Article {
  slug?: string;
  type?: "tech" | "idea";
  title?: string;
  emoji?: string;
  topics?: string[];
  published?: boolean;
  published_at?: string;
}

export interface ArticleContent {
  value: Article;
  uri: vscode.Uri;
  filename: string;
  itemtype: string;
}

export class ArticleContentError extends Error {
  static isError(value: unknown): value is ArticleContentError {
    return value instanceof ArticleContentError;
  }
}

export type ArticleContentLoadResult = ArticleContent | ArticleContentError;

export function spanListDatasets(
  outputChannel: vscode.OutputChannel
): Promise<any[]> {
  return new Promise<any[]>((resolve) => {
    const kagglePath = getKaggleExecutablePath();
    if (kagglePath === '') {
      vscode.window.showErrorMessage('kaggle executable not found');
    }
    const args = [
      'datasets',
      'list',
      '-m',
      '--sort-by',
      'updated',
      '--csv',
    ];

    const p = child_process.spawn(kagglePath, args);
    const result: any[] = [];
    p.stdout.setEncoding('utf-8');
    p.stdout.on('data', (data) => {
      const lines = data.split('\n');
      for (const line of lines) {
        const items = line.split(',');

        if (items.length < 5 || items[0] === "ref") {
          continue;
        }
        result.push({
          value: {
            slug: items[0],
            title: items[1],
            emoji: "",
            published: true,
            published_at: items[3],
            published_name: "test"
          },
          uri: vscode.Uri.parse("https://kaggle.com/datasets/" + items[0]),
          filename: items[0].split("/")[1],
          itemtype: "dataset",
        });
      }
    });
    p.on('exit', (code) => {
      resolve(result);
    });
  });
}


export async function getKaggleDatasetItems(outputChannel: vscode.OutputChannel): Promise<any[]> {
  const kagglePath = getKaggleExecutablePath();
  if (kagglePath === '') {
    vscode.window.showErrorMessage('kaggle executable not found');
  }
  const items = await spanListDatasets(outputChannel);

  return items;
}


/** 記事の一覧を返す */
export async function getArticleContents(
  context: AppContext
): Promise<ArticleContentLoadResult[]> {
  const items = await getKaggleDatasetItems(context.outputChannel);
  return items;
}


export function spanListCodes(
  outputChannel: vscode.OutputChannel
): Promise<any[]> {
  return new Promise<any[]>((resolve) => {
    const kagglePath = getKaggleExecutablePath();
    if (kagglePath === '') {
      vscode.window.showErrorMessage('kaggle executable not found');
    }
    const args = [
      'kernels',
      'list',
      '-m',
      '--sort-by',
      'dateRun',
      '--csv',
    ];

    const p = child_process.spawn(kagglePath, args);
    const result: any[] = [];
    p.stdout.setEncoding('utf-8');
    p.stdout.on('data', (data) => {
      const lines = data.split('\n');
      for (const line of lines) {
        const items = line.split(',');

        if (items.length < 5 || items[0] === "ref") {
          continue;
        }
        result.push({
          value: {
            slug: items[0],
            title: items[1],
            emoji: "",
            published: true,
            published_at: items[3],
            published_name: "test"
          },
          uri: vscode.Uri.parse("https://kaggle.com/code/" + items[0]),
          filename: items[0].split("/")[1],
          itemtype: "code",
        });
      }
    });
    p.on('exit', (code) => {
      resolve(result);
    });
  });
}


export async function getKaggleCodesItems(outputChannel: vscode.OutputChannel): Promise<any[]> {
  const kagglePath = getKaggleExecutablePath();
  if (kagglePath === '') {
    vscode.window.showErrorMessage('kaggle executable not found');
  }
  const items = await spanListCodes(outputChannel);

  return items;
}


export async function getCodesContents(
  context: AppContext
): Promise<ArticleContentLoadResult[]> {
  const items = await getKaggleCodesItems(context.outputChannel);
  return items;
}


export function spanListModels(
  outputChannel: vscode.OutputChannel
): Promise<any[]> {
  return new Promise<any[]>((resolve) => {
    const kagglePath = getKaggleExecutablePath();
    if (kagglePath === '') {
      vscode.window.showErrorMessage('kaggle executable not found');
    }
    const args = [
      'models',
      'list',
      '--owner',
      'confirm',
      '--sort-by',
      'createTime',
      '--csv',
    ];

    const p = child_process.spawn(kagglePath, args);
    const result: any[] = [];
    p.stdout.setEncoding('utf-8');
    p.stdout.on('data', (data) => {
      const lines = data.split('\n');
      for (const line of lines) {
        const items = line.split(',');

        if (items.length < 5 || items[0] === "id") {
          continue;
        }
        result.push({
          value: {
            slug: items[1],
            title: items[2],
            emoji: "",
            published: true,
            published_at: undefined,
            published_name: "test"
          },
          uri: vscode.Uri.parse("https://kaggle.com/models/" + items[1]),
          filename: items[1].split("/")[1],
          itemtype: "model",
        });
      }
    });
    p.on('exit', (code) => {
      resolve(result);
    });
  });
}


export async function getKaggleModelsItems(outputChannel: vscode.OutputChannel): Promise<any[]> {
  const kagglePath = getKaggleExecutablePath();
  if (kagglePath === '') {
    vscode.window.showErrorMessage('kaggle executable not found');
  }
  const items = await spanListModels(outputChannel);
  return items;
}


export async function getModelsContents(
  context: AppContext
): Promise<ArticleContentLoadResult[]> {
  const items = await getKaggleModelsItems(context.outputChannel);
  return items;
}