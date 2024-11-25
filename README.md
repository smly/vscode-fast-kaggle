<a href="https://marketplace.visualstudio.com/items?itemName=smly.fastkaggle">
  <img src="./images/fastkaggle_128x128.png" alt="fastkaggle logo" title="FastKaggle" align="right" height="60" />
</a>

# Kaggle Extension for VS Code

[![Version](https://vsmarketplacebadges.dev/version-short/smly.fastkaggle.svg)](https://marketplace.visualstudio.com/items?itemName=smly.fastkaggle)

Simplify your Kaggle workflow: Update and manage datasets and kernels directly within VS Code.

## How to use

This extension uses the `kaggle` command line tool to interact with Kaggle.
You need to have the [Kaggle CLI](https://github.com/Kaggle/kaggle-api) installed on your machine.

```bash
$ pip install kaggle
```

If the path to the `kaggle` command is in the PATH of the shell, you can use this extension without any settings. You can specify the path to the `kaggle` executable in the `settings.json`. For example:

```diff
+    "fastkaggle.executablePath": "/path/to/executable/kaggle"
```

## Features

### Commands: Update Datasets

Search for the `dataset-metadata.json` file in the directory where the currently open file is located or in the parent directory, set that directory as the current directory, and execute `kaggle d download -p /path/to/datasets`.

**Shotcut**: `Ctrl+Shift+D`.

### Commands: Update Kernels

Search for the `kernel-metadata.json` file in the directory where the currently open file is located or in the parent directory, set that directory as the current directory, and execute `kaggle kernels pull -p /path/to/kernels`.

**Shotcut**: `Ctrl+Shift+K`.

### Commands: List Datasets

List recent datasets in order of update. `kaggle d list -m --sort-by updated` is executed and the output is displayed.

### Commands: List Kernels

List recent kernels in order of run date. `kaggle kernels list -m --sort-by dateRun` is executed and the output is displayed.

**Enjoy!**
