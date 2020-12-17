'use strict';
import * as vscode from 'vscode';
import * as path from "path";

const MAX_ICONS = 99;
const OFF = 0;
const ABS = 1;
const REL = 2;

export function activate(context: vscode.ExtensionContext) {
    var decorations: vscode.TextEditorDecorationType[] = createDecorations();
    var showLeftCol = OFF;
    var showRightCol = OFF;

    vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
        if (showLeftCol == OFF) return;

        setLeftDecorations();
        // setRightDecorations();
    });
    
    vscode.commands.registerCommand("vscode-double-line-numbers.abs_rel", () => {
        showLeftCol = ABS;
        showRightCol = REL;
        setLeftDecorations();	
        setRightDecorations();	
    });

    vscode.commands.registerCommand("vscode-double-line-numbers.rel_abs", () => {
        showLeftCol = REL;
        showRightCol = ABS;
        setLeftDecorations();	
        setRightDecorations();	
    });

    vscode.commands.registerCommand("vscode-double-line-numbers.abs", () => {
        showLeftCol = OFF;
        showRightCol = ABS;
        setLeftDecorations();	
        setRightDecorations();	
    });

    vscode.commands.registerCommand("vscode-double-line-numbers.rel", () => {
        showLeftCol = OFF;
        showRightCol = REL;
        setLeftDecorations();	
        setRightDecorations();	
    });

    vscode.commands.registerCommand("vscode-double-line-numbers.off", () => {
        showLeftCol = OFF;
        showRightCol = OFF;
        setLeftDecorations();	
        setRightDecorations();	
    });

    // Sets Decorations On Left Column 
    function setLeftDecorations(): void {
        var editor = vscode.window.activeTextEditor;
        if (!editor) return;

        if(showLeftCol == OFF){
            decorations.forEach((d) => {
                editor?.setDecorations(d, []);
            });
        } else if(showLeftCol == ABS) {
            var totalLines = editor.document.lineCount;
            
            for(var i = 1; i <= MAX_ICONS && i <= totalLines; ++i) {
                var rangesForDecoration: vscode.Range[] = [new vscode.Range(i-1, 0, i-1, 0)];
                editor.setDecorations(decorations[i], rangesForDecoration);
            }

        } else if(showLeftCol == REL) {
            var selection = editor.selection;
            var text = editor.document.getText(selection);

            var line = editor.selection.active.line;
            var totalLines = editor.document.lineCount;

            for (var delta = 1; delta < MAX_ICONS; delta++) {
                var rangesForDecoration: vscode.Range[] = [];

                // Check upwards
                if (line - delta >= 0) {
                    rangesForDecoration.push(new vscode.Range(line - delta, 0, line - delta, 0));
                }

                // Check downwards
                if (line + delta < totalLines) {
                    rangesForDecoration.push(new vscode.Range(line + delta, 0, line + delta, 0));
                }

                editor.setDecorations(decorations[delta], rangesForDecoration);
            }

        } 
        
    }
    
    function createDecorations(): vscode.TextEditorDecorationType[] {
        var ret = [];
        for (var i = 0; i <= MAX_ICONS; i++) {
            ret.push(
                vscode.window.createTextEditorDecorationType(<any>{
                    gutterIconPath: path.join(__dirname, "..", "images", i.toString() + ".png"),
                    gutterIconSize: "cover",
                })
            )
        }
        return ret;
    }

    // Updates "editor.lineNumbers" in settings.json
    function setRightDecorations(): void {
        
        const configuration = vscode.workspace.getConfiguration("editor");

        switch (showRightCol) {
            case OFF:
                configuration.update("lineNumbers", "off", vscode.ConfigurationTarget.Global);
                break;
            case ABS:
                configuration.update("lineNumbers", "on", vscode.ConfigurationTarget.Global);
                break;
            case REL:
                configuration.update("lineNumbers", "relative", vscode.ConfigurationTarget.Global);
                break;
        }
    }
}

export function deactivate() {}
