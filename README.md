# dynapp-localization README
The Localize Dynapp extension is designed to work with the DYNAPP platform developed by WIP. It allows users to place text from a JSON file to a messages.properties file for localization. This makes it easier to manage and update localized content in your DYNAPP applications.

## Features
Currently the extension has the following features:
- Command to place current selection in messages file, with user defined key
- Show the localized value with annotation inline of your code:

![image of text annotations](image.png)

## Requirements

This extension requires Visual Studio Code to be installed. You can download it from the official website.

## Extension Settings


This extension contributes the following settings:

* `dynapp-localization.defaultlanguage`: This is the default language extension to use, like 'en', 'sv' or other. Leave blank for `messages.properties`.
* `dynapp-localization.messagespath`: This is the folder of dynapp data items relative to project root. The default path is `/data-items/`.
* `dynapp-localization.annotationcolor`: This is the color of the text that is placed after localized variables. The default color is `rgba(255, 255, 255, 0.5)`.


## Possible improvements

- Currently we dont check if the variable already exists in the messages file. so instead of just adding it should notify the  user and force a new key.
- Add the ability to edit the value directly from the  preview
- Check multiple messages files, based on root.json hierarchy


## Release Notes

Create first version of the extension

### 0.1.0

Initial release of Dynapp localization


-----------------------------------------------------------------------------------------------------------

