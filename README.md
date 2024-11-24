# vscode-fast-kaggle

This is a Visual Studio Code extension that allows you to interact with Kaggle from within the editor. It is a wrapper around the Kaggle API, and provides a convenient way to update/list datasets and kernels.

## Features

TBD

* `fastkaggle.updateDatasets` command. `kaggle d download -p /path/to/datasets` is executed. shotcut key: `Ctrl+Shift+D`.
* `fastkaggle.updateKernels` command. `kaggle kernels pull -p /path/to/kernels` is executed. shotcut key: `Ctrl+Shift+K`.
* `fastkaggle.listDatasets` command. `kaggle d list -m --sort-by updated` is executed and the output is displayed.
* `fastkaggle.listKernels` command. `kaggle kernels list -m --sort-by dateRun` is executed and the output is displayed.

## Requirements

You need to have the Kaggle API installed on your machine. You can install it by running `pip install kaggle`.

## Extension Settings

This extension uses the `kaggle` command line tool to interact with Kaggle. You can specify the path to the `kaggle` executable in the `settings.json`. For example:

```json
{
    "fastkaggle.executablePath": "/Users/username/.local/bin/kaggle"
}
```

**Enjoy!**
