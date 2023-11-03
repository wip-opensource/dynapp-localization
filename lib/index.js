#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const vscode = require('vscode')

function StartPlaceInMessage(value) {
  vscode.window.showInformationMessage('Hello World from remoteToLocalimagevsCode!');
  vscode.workspace.workspaceFolders.forEach((item) => {
    var options = {
      directory: item.uri.path
    }
    PlaceInMessages(value,options)
  })
}

function PlaceInMessages(value,options){
  console.log(value);
  // Find messages.properties
  const propertiesFilePath = path.join(options.directory, 'messages.properties');

  // Ask user via vscode what the key should be called
  vscode.window.showInputBox({ prompt: 'Enter the key for the new message' }).then((key) => {
    if (key) {
      // Make a new entry in the messages.properties file with the new key and value
      const newEntry = `\n`+key+`=`+value;

      fs.appendFile(propertiesFilePath, newEntry, (err) => {
        if (err) {
          vscode.window.showErrorMessage('Failed to add new entry to messages.properties');
        } else {
          vscode.window.showInformationMessage('New entry added to messages.properties');
        }
      });
    }
  });
}

module.exports = {
  StartPlaceInMessage
}
