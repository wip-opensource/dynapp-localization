#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const vscode = require('vscode')

function StartPlaceInMessage(value, range) {
  PlaceInMessagesAsync(value, range)
}

async function PlaceInMessagesAsync(value, range) {
  // Find messages.properties
  let propertiesFilePath = getMessagesPaths()[0]
  // Ask user via vscode what the key should be called
  const preFillValue = vscode.workspace.getConfiguration('dynapp-localization').get("prefillvalue") || ''
  const key = await vscode.window.showInputBox({ value: preFillValue, title: `Value: ${value}`, prompt: `Enter the key name for the new message in ` + path.basename(propertiesFilePath) });
  if (key) {
    // Make a new entry in the messages.properties file with the new key and value
    const newEntry = `\n` + key + `=` + value;

    try {
      await fs.promises.appendFile(propertiesFilePath, newEntry);
      // Replace selected text with the key in the format %{placekeyhere}
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await editor.edit((editBuilder) => {
          editBuilder.replace(range, `%{${key}}`);
        });
      }
      vscode.window.showInformationMessage(`New entry "${value}" added to ` + path.basename(propertiesFilePath));
    } catch (err) {
      vscode.window.showErrorMessage('Failed to add new entry to messages.properties');
    }
  }

}

function getLocalizationPrefixes() {
  let dataItemPath = getDataItemPath()
  const rootJson = JSON.parse(require('fs').readFileSync(path.join(getWorkspacePath(), dataItemPath, 'root.json'), 'utf8'));
  if (!rootJson) {
    return null
  }
  return rootJson.localizationprefixes || []
}

function getDataItemPath() {
  return vscode.workspace.getConfiguration('dynapp-localization').get("dataitempath") || ''
}

function getWorkspacePath(activeEditor = vscode.window.activeTextEditor) {
  if (!activeEditor) {
    return null
  }
  let document = activeEditor.document;
  let workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

  if (workspaceFolder) {
    return workspaceFolder.uri.fsPath;
  }
  return null
}

function getMatchingStrings(document, regex = /%\{([^\}]+)\}/g) {
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
  var result = null
  var correctFile = "None"

  var messagesFiles = getMessagesPaths()
  messagesFiles.every((file) => {
    result = getValueFromFile(word, file)
    if (result) {
      correctFile = file
      console.log(`key: ${word}, found in ${path.basename(file)}`)
      return false
    }
    return true
  })

  if (!result) {
    (vscode.workspace.getConfiguration('dynapp-localization').get("languagePostfixes") || []).every((prefix) => {
      var messagesFiles = getMessagesPaths(prefix)

      messagesFiles.every((file) => {
        result = getValueFromFile(word, file)
        if (result) {
          correctFile = file
          console.log(`key: ${word}, found in ${path.basename(file)}`)
          return false
        }
        return true
      })
      if (result) {
        return false
      }
      return true
    })
  }

  return { value: result, file: correctFile }
}

function getValueFromFile(word, messagesPath) {
  if (!fs.existsSync(messagesPath)) {
    return null;
  }

  const match = word.match(/%\{(.+)\}/);
  if (match) {
    const variableName = match[1];

    // Read the properties file
    const propertiesPath = messagesPath;
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

function getMessagesPaths(langextension = vscode.workspace.getConfiguration('dynapp-localization').get("defaultlanguage") || '') {
  let activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return null
  }

  const messagesPath = vscode.workspace.getConfiguration('dynapp-localization').get("dataitempath") || ''

  const prefixes = getLocalizationPrefixes()
  prefixes.unshift("")
  var messagesFiles = []

  prefixes.forEach((prefix) => {
    var messagesFilename = `${prefix}-`
    if (prefix == "") {
      messagesFilename = ""
    }
    if (langextension !== '') {
      messagesFilename += `messages_${langextension}.properties`
    }
    else {
      messagesFilename += `messages.properties`
    }
    const fullPath = path.join(getWorkspacePath(activeEditor) + messagesPath, messagesFilename)
    if (fs.existsSync(fullPath)) {
      messagesFiles.push(fullPath);
    }
  })

  return messagesFiles
}

function getUnderlineRanges(document) {
  const ranges = [];
  try {
    JSON.parse(document.getText())
  }
  catch (err) {
    return []
  }

  function addRange(string, text, ranges) {
    const startPos = document.positionAt(text.indexOf(string));
    const endPos = document.positionAt(text.indexOf(string) + string.length);
    const range = new vscode.Range(startPos, endPos);
    ranges.push(range);
  }

  function testString(string, text, ranges) {

    if (string) {
      if (string.endsWith(".json") || string.endsWith(".png") || string.endsWith(".jpg") || string.endsWith(".jpeg")) {
        return
      }
      let regex = /%\{([^\}]+)\}/;
      if (!regex.test(string)) {
        addRange(string, text, ranges)
      }
    }
  }

  function extractTextSubviews(subviews, text, ranges) {
    for (const subview of subviews) {
      if (subview.text) {
        testString(subview.text, text, ranges);
      }
      if (subview.subviews) {
        extractTextSubviews(subview.subviews, text, ranges);
      }
    }
  }

  const text = document.getText()
  const json = JSON.parse(document.getText())
  if (json.bindings || json.itembindings) {
    const bindings = json.bindings || json.itembindings
    let string = null
    let strings = []
    bindings.forEach((binding) => {
      if (binding.view) {
        if (binding.view.includes(":background") || binding.view.includes(":color") || binding.view.includes(":hintcolor") || binding.view.includes(":bordercolor") || binding.view.includes(":actioncolor") || binding.view.includes(":tint")) {
          return
        }
      }
      if (!binding.source) {
        return
      }
      if (typeof binding.source === 'string' || binding.source instanceof String) {
        string = binding.source
      }
      else if (typeof binding.source === 'object' || binding.source instanceof Object) {
        if (binding.source.type && binding.source.type == 'literal') {
          if (binding.source.value) {
            string = binding.source.value
          }
        }
      }
      if (string) {
        if (!strings.includes(string))
          strings.push(string)
      }
    });
    if (json.waitmessage) {
      strings.push(json.waitmessage)
    }
    strings.forEach((_string) => {
      testString(_string, text, ranges)

    })
  }
  //Check for subviews (cell files )
  else if (typeof json === 'object' || json instanceof Object) {
    if (json.subviews) {
      extractTextSubviews(json.subviews, text, ranges)
    }
  }
  else {
    //Checks list for keys that might be hard coded. 
    var items = []
    if (Array.isArray(json)) {
      items = json
    }
    else if (json.items && Array.isArray(json.items)) {
      items = json.items
    }
    let stringsToTest = ['title', 'subtitle', 'text', 'body']
    items.forEach((item) => {
      let strings = []
      stringsToTest.forEach(testString => {
        if (!item[testString]) {
          return
        }
        if (typeof item[testString] === 'string' || item[testString] instanceof String) {
          strings.push(item[testString])
        }
        else if (typeof item[testString] === 'object' || item[testString] instanceof Object) {
          if (item[testString].type && item[testString].type == 'literal') {
            if (item[testString].value) {
              strings.push(item[testString].value)
            }
          }
        }
      })
      strings.forEach((string) => {
        testString(string, text, ranges)

      })

    })

  }
  return ranges;
}

module.exports = {
  StartPlaceInMessage, getMatchingStrings, getValueFromMessages, getLocalizationPrefixes, getMessagesPaths, getUnderlineRanges, PlaceInMessagesAsync
}
