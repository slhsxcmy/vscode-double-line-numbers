// TODO: change theme -> regenerate images
// TODO: save themed images in cache 
// TODO: save showLeftCol and showRightCol globally
// TODO: use TextEditorVisibleRangesChangeEvent, onDidChangeTextEditorVisibleRanges(e)
// TODO: add sorting to loadImages??
// TODO: setting ABS+REL, enter, shows all 1's
// TODO: try reading images on the fly???
// FIXME: entering new lines before extension loads will not load image later
/*
    onDidChangeActiveTextEditor         if totalLines changed, might need to generate images
    onDidChangeTextEditorSelection      if totalLines changed, might need to generate images; if left REL, also need to setLeftDecorations
    onDidChangeTextEditorVisibleRanges  setLeftDecorations
    
    setLeftDecorations      if ABS, set decor for visibleRanges globally; 
                            if REL, set decor for visibleRanges w.r.t activeLine; 
    setRightDecorations     set VSCode lineNumbers setting
    

    number i (shown digit) -> decorationMap -> TextEditorDecorationType w/ .png to show
                           -> decorationRanges -> Range[] w/ lines to show this digit
*/
'use strict';
import * as vscode from 'vscode';
import { generateImages, OUT_DIR } from "./generateImages";

const RESIZE_FACTOR = 2;

const UNDEF = 0;
const OFF = 1;
const ABS = 2;
const REL = 3;

const SHOW_LEFT_COL = 'vscode-double-line-numbers_showLeftCol';
// const SHOW_RIGHT_COL = 'vscode-double-line-numbers_showRightCol';
const MAX_ICONS = 'vscode-double-line-numbers_maxIcons';

/* This extension activates on startup */
export function activate(context: vscode.ExtensionContext) {
    // var decorations : vscode.TextEditorDecorationType[];
    var decorationMap : Map<number, vscode.TextEditorDecorationType>;
    var decorationRanges : Map<number, vscode.Range[]>; 
    // var rangesForDecoration : vscode.Range [];
    var showLeftCol : number = UNDEF;
    var showRightCol : number = UNDEF;
    var maxIcons : number = UNDEF;
    const editorConfiguration = vscode.workspace.getConfiguration("editor");
        
    debug();
    init();
    
 
    function debug() {
        context.globalState.update(MAX_ICONS, 100);
        console.log("debug: maxIcons reset to " + context.globalState.get(MAX_ICONS));
        // context.globalState.update(SHOW_LEFT_COL, ABS);
        // showLeftCol = ABS;
        // console.log("debug: showLeftCol set to " + context.globalState.get(SHOW_LEFT_COL));
    }   

    function init() {
        decorationMap = new Map();
        decorationRanges = new Map();
        showLeftCol = context.globalState.get(SHOW_LEFT_COL) || OFF;
        
        switch (editorConfiguration.get("lineNumbers")) {
            case 'off':
                showRightCol = OFF;
                break;
            case 'on':
                showRightCol = ABS;
                break;
            case 'relative':
                showRightCol = REL;
                break;
        }

        maxIcons = context.globalState.get(MAX_ICONS) || 100;
        
        generateImages(1, maxIcons);
        loadImages(1, maxIcons);

        setLeftDecorations();
        setRightDecorations();
    }

    // TODO: test generating images
    // Seems like onDidChangeTextEditorVisibleRanges is triggered before the two others
    // So we might have to update maxIcons here too???
    // TODO: Bug: if uncommented, enter shows all 1's
    vscode.window.onDidChangeTextEditorVisibleRanges(() => {
        // var editor = vscode.window.activeTextEditor;
        // if (!editor) return;
        // var totalLines = editor.document.lineCount;
        // if(RESIZE_FACTOR * totalLines > maxIcons) {
        //     generateImages(maxIcons, RESIZE_FACTOR * totalLines);
        //     loadImages(maxIcons, RESIZE_FACTOR * totalLines);
        //     maxIcons = RESIZE_FACTOR * totalLines;
        //     context.globalState.update(MAX_ICONS, maxIcons);
        // }
        setLeftDecorations();
    });

    // calculate file length and generate more images if needed
    vscode.window.onDidChangeActiveTextEditor(() => {
        // console.log("vscode.window.onDidChangeActiveTextEditor")

        // var editor = vscode.window.activeTextEditor;
        // if (!editor) return;
        // var totalLines = editor.document.lineCount;
        // if(RESIZE_FACTOR * totalLines > maxIcons) {
        //     generateImages(maxIcons, RESIZE_FACTOR * totalLines);
        //     loadImages(maxIcons, RESIZE_FACTOR * totalLines);
        //     maxIcons = RESIZE_FACTOR * totalLines;
        //     context.globalState.update(MAX_ICONS, maxIcons);
        // }
        setLeftDecorations();
    });

    // when selecting other lines and in relative mode, set left column
    // doesn't trigger when entering another editor
    vscode.window.onDidChangeTextEditorSelection(() => {
        // console.log("vscode.window.onDidChangeTextEditorSelection!!!")
        
        // var editor = vscode.window.activeTextEditor;
        // if (!editor) return;
        // var totalLines = editor.document.lineCount;
        // if(RESIZE_FACTOR * totalLines > maxIcons) {
        //     generateImages(maxIcons, RESIZE_FACTOR * totalLines);
        //     loadImages(maxIcons, RESIZE_FACTOR * totalLines);
        //     maxIcons = RESIZE_FACTOR * totalLines;
        //     context.globalState.update(MAX_ICONS, maxIcons);
        // }

        setLeftDecorations();
    });


// TODO: test without generating images    
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
        // update global storage
        switch (showLeftCol) {
            case OFF:
                context.globalState.update(SHOW_LEFT_COL, OFF);
                break;
            case ABS:
                context.globalState.update(SHOW_LEFT_COL, ABS);
                break;
            case REL:
                context.globalState.update(SHOW_LEFT_COL, REL);
                break;
        }

        var editor = vscode.window.activeTextEditor!;
        if (!editor) return;
        if(showLeftCol == OFF) {
            // TODO: always clear all existing decor first???
            // decorations.forEach((d) => {
            //     editor.setDecorations(d, []);
            // });
            for (const [key, value] of decorationMap.entries()) {
                editor.setDecorations(value, []);
            }
        } else 
        if(showLeftCol == ABS) {
            var visibleStart = editor.visibleRanges[0].start.line;
            var visibleEnd = editor.visibleRanges[0].end.line;

            // console.log("visible: " + visibleStart + " ~ " + visibleEnd);

            for(var i = visibleStart; i <= visibleEnd; ++i){
                // var rangesForDecoration: vscode.Range[] = [new vscode.Range(i, 0, i, 0)];
                // var range = decorationRanges.get(i+1);
                // if(!range) continue;  // ???
                var decor = decorationMap.get(i+1);
                if(!decor) continue;  // TODO: ???
                
                var range = [new vscode.Range(i, 0, i, 0)];  // TODO: check pass by reference???
                decorationRanges.set(i+1, range);
                
                // range = [new vscode.Range(i, 0, i, 0)];  // TODO: check pass by reference???
                
                // console.log(range === decorationRanges.get(i+1))
            
                editor.setDecorations(decor, range);
            }


            // var totalLines = editor.document.lineCount;
            

            // for(var i = 1; i <= maxIcons && i <= totalLines; ++i) {
            //     var rangesForDecoration: vscode.Range[] = [new vscode.Range(i-1, 0, i-1, 0)];
            //     editor.setDecorations(decorations[i], rangesForDecoration);
            // }

        } else if(showLeftCol == REL) {
            // TODO: need to clear other keys ???
            var activeLine = editor.selection.active.line;
            var visibleStart = editor.visibleRanges[0].start.line;
            var visibleEnd = editor.visibleRanges[0].end.line;

            // editor.setDecorations(decorations.get(getImagePath(activeLine)), []);
            
            // console.log("visible: " + visibleStart + " ~ " + visibleEnd);

            // TODO: reset decor for activeLine
            // 0.png is blank for i == activeLine
            for(var i = visibleStart; i <= visibleEnd; ++i){
                // if(i == activeLine) continue;
                
                var decor = decorationMap.get(Math.abs(activeLine - i));
                if(!decor) continue;  // TODO: ???
                

                // IMPORTANT: if the same number shows on two lines (activeLine between visibleStart and visibleEnd),
                // we must use one rangesForDecoration for them, otherwise the latter one overwrites the first
                var range = [new vscode.Range(i, 0, i, 0)];  // TODO: check pass by reference???
                // reflect i across activeLine
                if(visibleStart <= 2*activeLine - i && 2*activeLine - i <= visibleEnd) {
                    range.push(new vscode.Range(2*activeLine - i, 0, 2*activeLine - i, 0));
                }
                decorationRanges.set(Math.abs(activeLine - i), range);
                
                console.log(range === decorationRanges.get(Math.abs(activeLine - i)))
            
                // console.log("i: " + i + " Math.abs(activeLine - i):" )
                // console.log(JSON.stringify(decor));

                editor.setDecorations(decor, range);
            }

            // var totalLines = editor.document.lineCount;

            // for (var delta = 1; delta < maxIcons; delta++) {
            //     var rangesForDecoration: vscode.Range[] = [];

            //     // Check upwards
            //     if (line - delta >= 0) {
            //         rangesForDecoration.push(new vscode.Range(line - delta, 0, line - delta, 0));
            //     }

            //     // Check downwards
            //     if (line + delta < totalLines) {
            //         rangesForDecoration.push(new vscode.Range(line + delta, 0, line + delta, 0));
            //     }

            //     editor.setDecorations(decorations[delta], rangesForDecoration);
            // }

        } 
        
    }

    // Updates "editor.lineNumbers" in settings.json
    function setRightDecorations(): void {
        
        // const configuration = vscode.workspace.getConfiguration("editor");

        switch (showRightCol) {
            case OFF:
                editorConfiguration.update("lineNumbers", "off", vscode.ConfigurationTarget.Global);
                break;
            case ABS:
                editorConfiguration.update("lineNumbers", "on", vscode.ConfigurationTarget.Global);
                break;
            case REL:
                editorConfiguration.update("lineNumbers", "relative", vscode.ConfigurationTarget.Global);
                break;
        }
    }

    function loadImages(start : number, end : number)/*: vscode.TextEditorDecorationType[] */{
       for (var i = start; i <= end; i++) {
            decorationMap.set(i,
                vscode.window.createTextEditorDecorationType({
                    gutterIconPath: getImagePath(i), // path.join(__dirname, "..", "images", i.toString() + ".png"),
                    gutterIconSize: "cover",
                })
            )

            decorationRanges.set(i, <vscode.Range[]>[]);
        }
    }

    // helper
    function getImagePath(i : number) {
        return OUT_DIR + i.toString() + ".png";
    }
}

export function deactivate() {}
