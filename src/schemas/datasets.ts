import * as vscode from "vscode";
import { AppContext } from "../extension";
import { getKaggleExecutablePath } from "../command";
import * as child_process from 'child_process';  // eslint-disable-line


export interface Dataset {
  slug: string;
  title: string;
  published_at: string;
}

export interface DatasetContent {
  value: Dataset;
  uri: vscode.Uri;
  filename: string;
  itemtype: string;
}

export class DatasetContentError extends Error {
  static isError(value: unknown): value is DatasetContentError {
    return value instanceof DatasetContentError;
  }
}

export type DatasetContentLoadResult = DatasetContent | DatasetContentError;

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
            published_at: items[3],
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


export async function getDatasetContents(
  context: AppContext
): Promise<DatasetContentLoadResult[]> {
  const items = await getKaggleDatasetItems(context.outputChannel);
  return items;
}