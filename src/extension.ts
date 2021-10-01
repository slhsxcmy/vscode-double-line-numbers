// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from "vscode";

const names: { [key: string]: string } = {
  abs_rel: "Absolute + Relative",
  rel_abs: "Relative + Absolute",
  abs: "Absolute",
  rel: "Relative",
  off: "Off",
};
const leftStateMap: { [key: string]: vscode.TextEditorLineNumbersStyle } = {
  abs_rel: vscode.TextEditorLineNumbersStyle.On,
  rel_abs: vscode.TextEditorLineNumbersStyle.Relative,
  abs: vscode.TextEditorLineNumbersStyle.Off,
  rel: vscode.TextEditorLineNumbersStyle.Off,
  off: vscode.TextEditorLineNumbersStyle.Off,
};
const rightStateMap: { [key: string]: vscode.TextEditorLineNumbersStyle } = {
  abs_rel: vscode.TextEditorLineNumbersStyle.Relative,
  rel_abs: vscode.TextEditorLineNumbersStyle.On,
  abs: vscode.TextEditorLineNumbersStyle.On,
  rel: vscode.TextEditorLineNumbersStyle.Relative,
  off: vscode.TextEditorLineNumbersStyle.Off,
};

class LineNumberManager {
  readonly LEFT_STATE_STORE = "vscode-double-line-numbers_LEFT_STATE";
  readonly NO_DECOR = -1;

  context: vscode.ExtensionContext;

  /* decorTypeMap
    {
      editor0: {
        0: decor00,
        1: decor01,
      },
      editor1: {
        0: decor10,
        1: decor11,
      },
      editor2: {
        0: decor20,
        1: decor21,
      }
    }  
  */
  decorTypeMap: Map<
    vscode.TextEditor,
    Map<number, vscode.TextEditorDecorationType>
  >;
  decorNumMap: Map<vscode.TextEditor, Map<number, number>>;

  /**
   * Constructor of LineNumberManager
   * @constructor
   * @param {vscode.ExtensionContext} context Context of this extension
   */
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.decorTypeMap = new Map();
    this.decorNumMap = new Map();

    this.updateAllDecor();
  }

  /**
   * Getter of right state
   * @returns {vscode.TextEditorLineNumbersStyle} right state
   */
  getRightState() {
    return vscode.workspace
      .getConfiguration()
      .get("editor.lineNumbers", rightStateMap["off"]);
  }

  /**
   * Setter of right state
   * @param {string} key right state key, one of "abs_rel", "rel_abs", "abs", "rel", "off"
   */
  setRightState(key: string) {
    let val;
    switch (rightStateMap[key]) {
      case vscode.TextEditorLineNumbersStyle.Off:
        val = "off";
        break;
      case vscode.TextEditorLineNumbersStyle.On:
        val = "on";
        break;
      case vscode.TextEditorLineNumbersStyle.Relative:
        val = "relative";
        break;
    }
    vscode.workspace
      .getConfiguration()
      .update("editor.lineNumbers", val, vscode.ConfigurationTarget.Global);
  }

  /**
   * Getter of left state
   * @returns {vscode.TextEditorLineNumbersStyle} left state
   */
  getLeftState() {
    return this.context.globalState.get(
      this.LEFT_STATE_STORE,
      leftStateMap["off"]
    );
  }

  /**
   * Setter of left state
   * @param {string} key left state key, one of "abs_rel", "rel_abs", "abs", "rel", "off"
   */
  setLeftState(key: string) {
    if (this.getLeftState() === leftStateMap[key]) return; // Optimization
    this.context.globalState.update(this.LEFT_STATE_STORE, leftStateMap[key]);
    this.updateAllDecor();
  }

  /**
   * Updates all decors in all open editors
   */
  updateAllDecor() {
    vscode.window.visibleTextEditors.forEach((editor) => {
      this.updateDecor(editor);
    });
  }

  /**
   * Updates decor in specified editor
   * @param {vscode.TextEditor} editor editor to update decor in
   */
  updateDecor(editor: vscode.TextEditor) {
    const start = Math.max(editor.visibleRanges[0].start.line - 1, 0); // 0-indexed
    const end = Math.min(
      editor.visibleRanges[0].end.line + 1,
      editor.document.lineCount - 1
    );
    const activeLine = editor.selection.active.line;

    // Create new map
    if (!this.decorTypeMap.has(editor))
      this.decorTypeMap.set(editor, new Map());
    if (!this.decorNumMap.has(editor)) this.decorNumMap.set(editor, new Map());

    for (let i = start; i <= end; ++i) {
      let num: number;
      if (this.getLeftState() === vscode.TextEditorLineNumbersStyle.Off) {
        num = this.NO_DECOR;
      } else if (this.getLeftState() === vscode.TextEditorLineNumbersStyle.On) {
        num = i + 1;
      } else if (
        this.getLeftState() === vscode.TextEditorLineNumbersStyle.Relative
      ) {
        num = Math.abs(activeLine - i);
      }

      // need to update: dispose old, map new
      if (this.decorNumMap.get(editor)!.get(i) !== num!) {
        this.decorTypeMap.get(editor)!.get(i)?.dispose();
        this.decorTypeMap.get(editor)!.set(i, this.createDecorType(num!));
        this.decorNumMap.get(editor)!.set(i, num!);
      }
    }

    // apply decor
    for (let i = start; i <= end; ++i) {
      if (this.decorNumMap.get(editor)!.has(i))
        editor.setDecorations(this.decorTypeMap.get(editor)!.get(i)!, [
          new vscode.Range(i, 0, i, 0),
        ]);
    }
  }

  /**
   * Create decor type based on specified number
   * @param {number} num number to generate decor for
   * @returns generated decor type
   */
  createDecorType(num: number) {
    if (num > 0) {
      return vscode.window.createTextEditorDecorationType({
        gutterIconPath: vscode.Uri.parse(getSvgUri(num)),
        gutterIconSize: "cover",
      });
    } else {
      return vscode.window.createTextEditorDecorationType({});
    }
  }
}

/**
 * Register all five commands
 * @param {LineNumberManager} mgr manager of line numbers
 */
function registerCommands(mgr: LineNumberManager) {
  for (let key in names) {
    let name = names[key];
    console.log(`Registering vscode-double-line-numbers.${name}`);
    let disposable = vscode.commands.registerCommand(
      `vscode-double-line-numbers.${key}`,
      () => {
        vscode.window.showInformationMessage(
          `Setting line numbers to ${name}!`
        );
        mgr.setLeftState(key);
        mgr.setRightState(key);
        if (key !== "off") {
          vscode.workspace
            .getConfiguration()
            .update(
              "editor.glyphMargin",
              true,
              vscode.ConfigurationTarget.Global
            );
        }
      }
    );

    mgr.context.subscriptions.push(disposable);
  }
}

/**
 * Generate data URI for SVG for given number
 * @param {number} num number to generate SVG for
 * @returns data URI string
 */
function getSvgUri(num: number) {
  const width = 100;
  const height = 100;
  const x = width;
  const y = height / 2;
  const textLength = width;
  const lengthAdjust = "spacingAndGlyphs";
  const fontWeight = "600";
  const fontSize = 66;
  const fontFamily = vscode.workspace
    .getConfiguration()
    .get("editor.fontFamily");
  const fill = encodeURIComponent(
    vscode.workspace
      .getConfiguration()
      .get("vscode-double-line-numbers.font.color", "#858585")
  );
  const textAnchor = "end";
  const dominantBaseline = "central";

  return `data:image/svg+xml;utf8,<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><text x="${x}" y="${y}" textLength="${textLength}" lengthAdjust="${lengthAdjust}" font-weight="${fontWeight}" font-size="${fontSize}" font-family="${fontFamily}" fill="${fill}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${num
    .toString()
    .padStart(3, "\u00A0")}</text></svg>`;
}

/**
 * Activates the extension
 * @param {vscode.ExtensionContext} context context for extension
 */
export function activate(context: vscode.ExtensionContext) {
  const mgr = new LineNumberManager(context);

  registerCommands(mgr);

  // scroll; create/delete new lines
  vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
    mgr.updateDecor(event.textEditor);
  });

  // click into different editor
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) mgr.updateDecor(editor);
  });

  // select new lines in editor
  vscode.window.onDidChangeTextEditorSelection((event) => {
    mgr.updateDecor(event.textEditor);
  });

  // open/close editors
  vscode.window.onDidChangeVisibleTextEditors((editors) => {
    mgr.updateAllDecor();
  });
}

/**
 * Deactivates the extension
 */
export function deactivate() {}
