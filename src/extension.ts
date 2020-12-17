// TODO: change theme -> regenerate images
// TODO: save themed images in cache 
// TODO: generate images from maxIcons to totalLines only
'use strict';
import * as vscode from 'vscode';
import { generateImages, OUT_DIR } from "./generateImages";

const OFF = 0;
const ABS = 1;
const REL = 2;

export function activate(context: vscode.ExtensionContext) {
    var decorations: vscode.TextEditorDecorationType[] = [];// = loadImages();
    var showLeftCol = OFF;
    var showRightCol = OFF;
    var maxIcons : number = context.globalState.get('maxIcons') || 1;

    debugResetMaxIcons();
 
    function debugResetMaxIcons() {
        context.globalState.update('maxIcons', 1);
        console.log("maxIcons reset to " + context.globalState.get('maxIcons'));
    }   

    generateImages(0, maxIcons);
    loadImages(0, maxIcons);

    // calculate file length and generate more images if needed
    vscode.window.onDidChangeActiveTextEditor(() => {
        var editor = vscode.window.activeTextEditor;
        if (!editor) return;
        var totalLines = editor.document.lineCount;
        if(2 * totalLines > maxIcons) {
            generateImages(maxIcons, 2 * totalLines);
            loadImages(maxIcons, 2 * totalLines);
            maxIcons = 2 * totalLines;
            context.globalState.update('maxIcons', maxIcons);
        }

        setLeftDecorations();
        setRightDecorations();
    });

    // when selecting other lines and in relative mode, set left column
    vscode.window.onDidChangeTextEditorSelection(() => {
        console.log("vscode.window.onDidChangeTextEditorSelection!!!")
        
        var editor = vscode.window.activeTextEditor;
        if (!editor) return;
        var totalLines = editor.document.lineCount;
        if(2 * totalLines >= maxIcons) {
            generateImages(maxIcons, 2 * totalLines);
            loadImages(maxIcons, 2 * totalLines);
            maxIcons = 2 * totalLines;
            context.globalState.update('maxIcons', maxIcons);
        }
        
        // if (showLeftCol == REL) setLeftDecorations();
        setLeftDecorations();
        setRightDecorations();
    });
    
    vscode.commands.registerCommand("vscode-double-line-numbers.abs_rel", () => {
        // loadImages();
        showLeftCol = ABS;
        showRightCol = REL;
        setLeftDecorations();	
        setRightDecorations();	
    });

    vscode.commands.registerCommand("vscode-double-line-numbers.rel_abs", () => {
        // loadImages();
        showLeftCol = REL;
        showRightCol = ABS;
        setLeftDecorations();	
        setRightDecorations();	
    });

    vscode.commands.registerCommand("vscode-double-line-numbers.abs", () => {
        // loadImages();
        showLeftCol = OFF;
        showRightCol = ABS;
        setLeftDecorations();	
        setRightDecorations();	
    });

    vscode.commands.registerCommand("vscode-double-line-numbers.rel", () => {
        // loadImages();
        showLeftCol = OFF;
        showRightCol = REL;
        setLeftDecorations();	
        setRightDecorations();	
    });

    vscode.commands.registerCommand("vscode-double-line-numbers.off", () => {
        // loadImages();
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
            
            for(var i = 1; i <= maxIcons && i <= totalLines; ++i) {
                var rangesForDecoration: vscode.Range[] = [new vscode.Range(i-1, 0, i-1, 0)];
                editor.setDecorations(decorations[i], rangesForDecoration);
            }

        } else if(showLeftCol == REL) {
            var line = editor.selection.active.line;
            var totalLines = editor.document.lineCount;

            for (var delta = 1; delta < maxIcons; delta++) {
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

    function loadImages(start : number, end : number)/*: vscode.TextEditorDecorationType[] */{
        // var ret = [];
        // decorations = [];
        for (var i = start; i <= end; i++) {
            decorations.push(
                vscode.window.createTextEditorDecorationType(<any>{
                    gutterIconPath: OUT_DIR + i.toString() + ".png", // path.join(__dirname, "..", "images", i.toString() + ".png"),
                    gutterIconSize: "cover",
                })
            )
        }
        // return ret;
    }

}

export function deactivate() {}
