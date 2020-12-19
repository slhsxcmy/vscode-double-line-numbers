# Double Line Numbers

This is a Visual Studio Code extension that allows you adjust the display of line numbers to a combination of absolute and relative settings. 

This should be helpful if you use one of the Vim plugins [VSCodeVim](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim), or are learning Vim like me.

## Installation

- Open the command palette in Visual Studio Code (`Ctrl-Shift-P` or `Cmd-Shift-P`)
- Select `Extension: Install Extension` and search for 'Double Line Numbers'

## Commands

Open the command palette and run one of the following commands:

- __Double Line Numbers: Absolute + Relative__ - show absolute line numbers on the left and relative line numbers on the right.

- __Double Line Numbers: Relative + Absolute__ - show relative line numbers on the left and absolute line numbers on the right.

- __Double Line Numbers: Absolute__ - only show absolute line numbers, essentially setting the built-in setting `editor.lineNumbers` to `on`.

- __Double Line Numbers: Relative__ - only show relative line numbers, essentially setting the built-in setting `editor.lineNumbers` to `relative`.

- __Double Line Numbers: Off__ - turn off all line numbers, essentially setting the built-in setting `editor.lineNumbers` to `off`.

## Source Code

[Github](https://github.com/slhsxcmy/vscode-double-line-numbers/)

## Known Issues

When rapidly increasing the file size for the first time, e.g. pasting a very long file or opening a very long file, certain images might glitch and show as blanks.  
At 10,000 lines, generating images can become very slow.  Hopefully you don't need to edit such long files.  
When I tried bundling with webpack, there is a missing fonts/ipag.ttf error. I don't know why but I'll try to fix it.  

## Technical Note

The Visual Studio Code API doesn't support a great way to display anything on the left of the built-in line numbers. "gutterIcon" is used to the numbers as images, but might break or overlap display with other functionality that uses the gutter such as debugging. In that case, you can turn the left column off with one of the last three commands.

Any feedback or ideas are appreciated. If you find any bugs, please let me know through issues!

## Acknowledgment

This extension is inspired by extr0py's Relative Line Numbers.
The images are generated using the `text-to-svg` and `sharp` libaries. 

## License

[GPL Version 3](LICENSE.md)
