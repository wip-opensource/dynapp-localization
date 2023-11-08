#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const vscode = require('vscode')

function StartPlaceInMessage(value) {
  PlaceInMessages(value)
}

function PlaceInMessages(value) {
  // Find messages.properties
  let propertiesFilePath = getMessagesPath()
  // Ask user via vscode what the key should be called
  vscode.window.showInputBox({ prompt: 'Enter the key name for the new message in ' + path.basename(propertiesFilePath) }).then((key) => {
    if (key) {
      // Make a new entry in the messages.properties file with the new key and value
      const newEntry = `\n` + key + `=` + value;

      fs.appendFile(propertiesFilePath, newEntry, (err) => {
        if (err) {
          vscode.window.showErrorMessage('Failed to add new entry to messages.properties');
        } else {
          // Replace selected text with the key in the format %{placekeyhere}
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            editor.edit((editBuilder) => {
              editor.selections.forEach((selection) => {
                editBuilder.replace(selection, `%{${key}}`);
              });
            });
          }
          vscode.window.showInformationMessage('New entry added to '+path.basename(propertiesFilePath));
        }
      });
    }
  });
}

function getMessagesPath() {
  let activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return null
  }
  vscode.workspace.workspaceFolders.forEach((item) => { })

  const messagesPath = vscode.workspace.getConfiguration('dynapp-localization').get("dataitempath") || ''
  const langextension = vscode.workspace.getConfiguration('dynapp-localization').get("defaultlanguage") || ''
  const messagesPrefix = vscode.workspace.getConfiguration('dynapp-localization').get("messagesprefix") || ''
  var messagesFilename = messagesPrefix+"messages.properties"
  if (langextension !== '') {
    messagesFilename = `messages_${langextension}.properties`
  }
  return path.join(getWorkspacePath(activeEditor)+ messagesPath, messagesFilename);
}

function getWorkspacePath(activeEditor) {
  if (!activeEditor) {
    return null
  }
  let document = activeEditor.document;
  let workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

  if (workspaceFolder) {
    return workspaceFolder.uri.fsPath; // This will print the file system path of the workspace folder
  } 
  return null
} 

function getMatchingStrings(document, regex = /%\{(.+)\}/g) {
  let text = document.getText();
  let matches = [...text.matchAll(regex)];
  let result = [];

  for (let match of matches) {
    let start = document.positionAt(match.index);
    let end = document.positionAt(match.index + match[0].length);
    let range = new vscode.Range(start, end);

    result.push({
      text: match[0],
      range: range
    });
  }

  return result;
}

function getValueFromMessages(word) {
  const match = word.match(/%\{(.+)\}/);
  if (match) {
    const variableName = match[1];

    // Read the properties file
    const propertiesPath = getMessagesPath();
    const properties = fs.readFileSync(propertiesPath, 'utf8');

    // Find the variable in the properties file
    const variableMatch = properties.match(new RegExp(`^${variableName}=(.+)`, 'm'));
    if (variableMatch) {
      const variableValue = variableMatch[1];

      return variableValue
    }
    return null
  }
}
module.exports = {
  StartPlaceInMessage, getMatchingStrings, getValueFromMessages, getMessagesPath
}
