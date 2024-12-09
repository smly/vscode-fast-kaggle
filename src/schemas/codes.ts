import * as vscode from "vscode";
import { AppContext } from "../extension";
import { getKaggleExecutablePath } from "../command";
import * as child_process from 'child_process';  // eslint-disable-line


export interface Code {
  slug?: string;
  type?: "tech" | "idea";
  title?: string;
  published_at?: string;
}

export interface CodeContent {
  value: Code;
  uri: vscode.Uri;
  filename: string;
  itemtype: string;
}

export class CodeContentError extends Error {
  static isError(value: unknown): value is CodeContentError {
    return value instanceof CodeContentError;
  }
}

export type CodeContentLoadResult = CodeContent | CodeContentError;

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
              published_at: items[3],
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
  ): Promise<CodeContentLoadResult[]> {
    const items = await getKaggleCodesItems(context.outputChannel);
    return items;
  }