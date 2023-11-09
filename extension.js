// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const script = require('./lib/index');
const fs = require('fs')
const path = require('path')
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {


	let testCommand = vscode.commands.registerCommand('dynapp-localization.testCommand', (document, range) => {
		// Code to run when the command is executed
		console.log(script.getMessagesPaths())

	});
	context.subscriptions.push(testCommand);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "dynapp-localization" is now active!');


	let runCommandDisposable = vscode.commands.registerCommand('dynapp-localization.placeInMessage', (document, range) => {
		// Code to run when the command is executed
		const editor = vscode.window.activeTextEditor;
		const selection = editor.selection;
		if (selection && !selection.isEmpty) {
			const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
			const highlighted = editor.document.getText(selectionRange);

			if (highlighted) {
				script.StartPlaceInMessage(highlighted, selectionRange)
			}
		}

	});

	context.subscriptions.push(runCommandDisposable);

	let runCommandDisposable2 = vscode.commands.registerCommand('dynapp-localization.placeRangeInMessage', (document, range) => {
		// Code to run when the command is executed		
		if (range) {
			const highlighted = vscode.window.activeTextEditor.document.getText(range);
			if (highlighted) {
				script.StartPlaceInMessage(highlighted, range)
			}
		}
	});

	context.subscriptions.push(runCommandDisposable2);

	context.subscriptions.push(vscode.languages.registerHoverProvider({ scheme: 'file' }, {
		provideHover(document, position, token) {
			const range = document.getWordRangeAtPosition(position, /%\{([^\}]+)\}/);
			if (range) {
				// Get the word within the range
				const word = document.getText(range);
				const message = script.getValueFromMessages(word)

				if (message) {
					return new vscode.Hover(` ${path.basename(message.file)}: ${message.value}`);
				}
			}
		}
	}));


	let activeEditor = vscode.window.activeTextEditor;
	let decorationTypes = []; // Add this line to keep track of all decoration types

	let hardStrings =[]
	function updateDecorations() {
		if (!activeEditor) {
			return;
		}

		// Clear old decorations
		decorationTypes.forEach(decoration => {
			activeEditor.setDecorations(decoration, []);
		});
		decorationTypes = []; // Reset the array

		let document = activeEditor.document;
		let matches = script.getMatchingStrings(document);
		//Appending text decoration
		matches.forEach((item) => {
			var messagesValue = script.getValueFromMessages(item.text).value || 'No value found'
			let decoration = vscode.window.createTextEditorDecorationType({
				after: {
					contentText: "." + messagesValue,
					color: vscode.workspace.getConfiguration('dynapp-localization').get("annotationcolor") || 'rgba(110, 110, 110, 0.8'
				}
			});

			// Add the new decoration type to the array
			decorationTypes.push(decoration);

			// Define your ranges
			let ranges = [
				item.range
				// Add more ranges as needed
			];

			// Apply the decoration type to the ranges in the active editor
			activeEditor.setDecorations(decoration, ranges);
		})

		hardStrings = script.getUnderlineRanges(document)
		const yellowUnderline = vscode.window.createTextEditorDecorationType({
			textDecoration: 'underline yellow dotted',
		});
		hardStrings.forEach(element => {
			decorationTypes.push(yellowUnderline)
		});
		activeEditor.setDecorations(yellowUnderline, hardStrings);	

	}
	
	class MyCodeActionProvider {
		provideCodeActions(document, range, context, token) {
			const codeAction = new vscode.CodeAction('Place in messages', vscode.CodeActionKind.QuickFix);
			
			// Check if the cursor is inside one of your ranges
			for (let myRange of hardStrings) {
				if (myRange.contains(range.start)) {
					// If it is, return the code action
					codeAction.command = {
						title: 'Place in messages',
						command: 'dynapp-localization.placeRangeInMessage',
						arguments: [document, myRange],
					};
					return [codeAction];
				}
			}

			// If not, return an empty array
			return [];
		}
	}
	vscode.languages.registerCodeActionsProvider({ scheme: 'file' }, new MyCodeActionProvider());

	let timeout = undefined;
	function triggerUpdateDecorations(throttle = false) {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		if (throttle) {
			timeout = setTimeout(updateDecorations, 500);
		} else {
			updateDecorations();
		}
	}

	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations(true);
		}
	}, null, context.subscriptions);

}



// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
