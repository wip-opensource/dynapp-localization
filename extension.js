// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const script = require('./lib/index');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "localization-dynapp" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('localization-dynapp.helloWorld', function () {
		// The code you place here will be executed every time your command is executed
		script.StartPlaceInMessage("New value")
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from localization-dynapp!');
	});

	context.subscriptions.push(disposable);


	let codeActionDisposable = vscode.languages.registerCodeActionsProvider('*', {
		provideCodeActions(document, range) {
			const codeAction = new vscode.CodeAction('Run Command', vscode.CodeActionKind.Empty);
			codeAction.command = {
				title: 'Run Command',
				command: 'localization-dynapp.placeInMessage',
				arguments: [document, range],
			};
			return [codeAction];
		}
	});

	context.subscriptions.push(codeActionDisposable);

	let runCommandDisposable = vscode.commands.registerCommand('localization-dynapp.placeInMessage', (document, range) => {
		// Code to run when the command is executed
		const editor = vscode.window.activeTextEditor;
		const selection = editor.selection;
		if (selection && !selection.isEmpty) {
			const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
			const highlighted = editor.document.getText(selectionRange);

			if (highlighted) {
				script.StartPlaceInMessage(highlighted)
			}
		}

	});

	context.subscriptions.push(runCommandDisposable);
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
