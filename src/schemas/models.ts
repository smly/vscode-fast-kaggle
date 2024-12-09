import * as vscode from "vscode";
import { AppContext } from "../extension";
import { getKaggleExecutablePath } from "../command";
import * as child_process from 'child_process';  // eslint-disable-line


export interface Model {
    slug?: string;
    type?: "tech" | "idea";
    title?: string;
    published_at?: string;
  }
  
  export interface ModelContent {
    value: Model;
    uri: vscode.Uri;
    filename: string;
    itemtype: string;
  }
  
  export class ModelContentError extends Error {
    static isError(value: unknown): value is ModelContentError {
      return value instanceof ModelContentError;
    }
  }
  
export type ModelContentLoadResult = ModelContent | ModelContentError;
  

function spanListModels(
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
              published_at: undefined,
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

async function getKaggleModelsItems(outputChannel: vscode.OutputChannel): Promise<any[]> {
    const kagglePath = getKaggleExecutablePath();
    if (kagglePath === '') {
      vscode.window.showErrorMessage('kaggle executable not found');
    }
    const items = await spanListModels(outputChannel);
    return items;
  }
  
  
  export async function getModelsContents(
    context: AppContext
  ): Promise<ModelContentLoadResult[]> {
    const items = await getKaggleModelsItems(context.outputChannel);
    return items;
  }