import * as vscode from "vscode";
import { handlePythonFile } from "./pythonHandler";
import { handleJupyterFile } from "./jupyterHandler";
import { globals } from "./globals";

let dockerMemory: number | undefined;
let dockerNanoCPUs: number | undefined;

export async function activate(context: vscode.ExtensionContext) {
  const collection = vscode.languages.createDiagnosticCollection("docker");

  // Déclarer les commandes
  const runAnalysisPython = vscode.commands.registerCommand(
    "antileak-ml.runAnalysisPython",
    () => {
      handlePythonFile(context);
    }
  );

  const runAnalysisNotebook = vscode.commands.registerCommand(
    "antileak-ml.runAnalysisNotebook",
    () => {
      handleJupyterFile(context);
    }
  );

  // Define a key for the global boolean variable
  const SHOW_RESULTS_TABLE_KEY = "antileak-ml.showResultsTable";

  // Retrieve the boolean value from global state (default to false if not set)
  let showResultsTable = context.globalState.get(SHOW_RESULTS_TABLE_KEY, false);

  // Command to toggle the boolean value
  const toggleResultsTable = vscode.commands.registerCommand(
    "antileak-ml.toggleTable",
    () => {
      // Toggle the boolean value
      showResultsTable = !showResultsTable;

      // Update the global state with the new value
      context.globalState.update(SHOW_RESULTS_TABLE_KEY, showResultsTable);

      // Notify the user (optional)
      vscode.window.showInformationMessage(
        `Results table visibility is now: ${showResultsTable ? "ON" : "OFF"}`
      );
    }
  );

  // Register the command
  context.subscriptions.push(toggleResultsTable);

  // Ajouter les commandes au contexte de l'extension
  context.subscriptions.push(runAnalysisPython, runAnalysisNotebook);

  // Créer le bouton dans la barre d'état
  const statusBarButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarButton.text = "$(file-code) Run Analysis"; // Texte et icône par défaut
  statusBarButton.tooltip = "Run analysis based on the current file type";
  context.subscriptions.push(statusBarButton);

  // Fonction pour mettre à jour la commande et la visibilité du bouton
  function updateStatusBar() {
    const activeEditor = vscode.window.activeTextEditor;

    if (activeEditor) {
      const fileExtension = activeEditor.document.fileName.split(".").pop();

      if (fileExtension === "py") {
        statusBarButton.command = "antileak-ml.runAnalysisPython";
        statusBarButton.text = "$(python) Run Python Analysis";
        statusBarButton.tooltip =
          "Analyze your Python script for data leakages";
        statusBarButton.show();
      } else if (fileExtension === "ipynb") {
        statusBarButton.command = "antileak-ml.runAnalysisNotebook";
        statusBarButton.text = "$(notebook) Run Notebook Analysis";
        statusBarButton.tooltip =
          "Analyze your Jupyter Notebook for data leakages";
        statusBarButton.show();
      } else {
        statusBarButton.hide(); // Cacher si le fichier n'est ni .py ni .ipynb
      }
    } else {
      statusBarButton.hide(); // Cacher si aucun éditeur n'est actif
    }
  }

  // Mettre à jour l'état du bouton à l'activation
  updateStatusBar();

  // Mettre à jour le bouton lorsque l'utilisateur change d'éditeur
  vscode.window.onDidChangeActiveTextEditor(
    updateStatusBar,
    null,
    context.subscriptions
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      const fileExtension = document.fileName.split(".").pop();
      if (document && fileExtension === "py") {
        handlePythonFile(context);
      } else if (fileExtension === "ipynb") {
        handlePythonFile(context);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveNotebookDocument(async (document) => {
      if (document && document.uri.path.endsWith("py")) {
        handlePythonFile(context);
      } else if (document.uri.path.endsWith("ipynb")) {
        handlePythonFile(context);
      }
    })
  );
}

export function deactivate() {}
