# Double Line Numbers

This is a Visual Studio Code extension that allows you adjust the display of line numbers to a combination of absolute and relative settings.

This should be helpful if you use one of the Vim plugins [VSCodeVim](#https://github.com/VSCodeVim/Vim), or are learning Vim like me.

The Visual Studio Code API doesn't support a great way to display anything on the left of the built-in line numbers. Therefore, "gutterIcon" is used to display the left line numbers as SVGs.

Any feedback or ideas are appreciated. If you find any bugs, please let me know through issues!

## Installation

- Install `Double Line Numbers` in the Extentions Marketplace
- Optional: You can customize the left line numbers appearance by going to `Settings > Extentions > Double Line Numbers`.

## Commands

Open the command palette (`Cmd/Ctrl + Shift + P`) and run one of the following commands:

- **Double Line Numbers: Absolute + Relative** - show absolute line numbers on the left and relative line numbers on the right.

- **Double Line Numbers: Relative + Absolute** - show relative line numbers on the left and absolute line numbers on the right.

- **Double Line Numbers: Absolute** - only show absolute line numbers, essentially setting the built-in setting `editor.lineNumbers` to `on`.

- **Double Line Numbers: Relative** - only show relative line numbers, essentially setting the built-in setting `editor.lineNumbers` to `relative`.

- **Double Line Numbers: Off** - turn off all line numbers, essentially setting the built-in setting `editor.lineNumbers` to `off`.

## Known Issues

1. [Displaying gutter icons hides breakpoints](https://github.com/microsoft/vscode/issues/5923). If you need to use breakpoints, you can do either of the following:

   - Turn off the left line numbers temporarily
   - Use the **Relative + Absolute** setting. The currently selected line does not have any gutter icon, so you can select the line first, then toggle the breakpoint.

2. The gutter width cannot be adjusted, so if the left line number has more than 4 digits, the digits become really squeezed and slim. Hopefully your not editing such a long file... Related issues:

   - [Add option editor.lineDecorationsWidth as official](https://github.com/microsoft/vscode/issues/93887)
   - [Add editor.contentLeftPadding to add padding between the editorGutter and editor.](https://github.com/microsoft/vscode/issues/135114)

## Acknowledgment

- This extension is inspired by [extr0py's Relative Line Numbers](https://marketplace.visualstudio.com/items?itemName=extr0py.vscode-relative-line-numbers).

## License

- [GPL Version 3](LICENSE.md)

## Links

- [Github](https://github.com/slhsxcmy/vscode-double-line-numbers/)
- [Marketplace](https://marketplace.visualstudio.com/items?itemName=slhsxcmy.vscode-double-line-numbers)
