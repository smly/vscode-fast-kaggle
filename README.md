<a href="https://marketplace.visualstudio.com/items?itemName=smly.fastkaggle">
  <img src="./images/fastkaggle_128x128.png" alt="fastkaggle logo" title="FastKaggle" align="right" height="60" />
</a>

# VS Code Extension for Kaggle

[![Version](https://vsmarketplacebadges.dev/version-short/smly.fastkaggle.svg)](https://marketplace.visualstudio.com/items?itemName=smly.fastkaggle)

Simplify your Kaggle workflow: Update and manage datasets and kernels directly within VS Code.

## How to use

This extension uses the `kaggle` command line tool to interact with Kaggle.
You need to have the [Kaggle CLI](https://github.com/Kaggle/kaggle-api) installed on your machine.

```bash
$ pip install kaggle
```

This extension contributes the following settings:

* `fastkaggle.executablePath`: Path to `kaggle` executable.

If the path to the `kaggle` command is in the PATH of the shell, you can use this extension without any settings.

## Features

### Update Datasets and Notebooks

* **Shortcut**: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>U</kbd>.
* **Usage**: <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> to open the command palette and select "Kaggle: Update Dataset/Notebook".

![command palette](./images/command_palette_update.png)

This command search for the `dataset-metadata.json` or `kernel-metadata.json` file in the directory where the currently open file is located or in the parent directory, set that directory as the current directory, and execute the update command.

#### Get status of the updated Datasets and Notebooks

Furthermore, by hitting the shortcut keys <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd>, you can check the status of the updated Dataset/Notebook. This is especially useful when working with notebooks that have long non-interactive session execution times! ✨

### Validate Metadata Files for Kaggle Datasets and Notebooks

This extension validates the JSON schema in kernel-metadata.json and dataset-metadata.json used to define Kaggle Datasets and Notebooks.

![validation](./images/validate_metadata.png)

### Sidebar View for Datasets, Notebooks and Models

The extension provides a sidebar view for datasets, notebooks and models.

![Sidebar View](./images/sidebar_view.png)

Right-click to open the context menu and check the status of the Dataset or Notebook.

![Context Menu](./images/sidebar_view_status.png)

The status of the dataset or notebook is displayed based on the result of the status sub-command.

![Status Result](./images/output_status.png)

### List Competitions

**Usage**: <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> to open the command palette and select "Kaggle: List Competitions".

List recent competitions in order of deadline. `kaggle competitions list` is executed and the output is displayed.

![List Competitions](./images/competition_list.png)

**Enjoy!**
