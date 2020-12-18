// TODO: change theme -> regenerate images
// TODO: save themed images for later
// FIXME: without generate image OK, if generate image enter shows 1's
// Fixed: ABS+REL -> REL+ABS some high ABS line numbers remains but can be refreshed if we selected past it: fixed by adding 0
// Fixed: REL+ABS -> ABS+REL give wrong number 0 on the selected line: either not load 0, or call clearLeftDecorations() first
// FIXME: the top and bottom of the page missings half a line number
/*
    onDidChangeActiveTextEditor         if totalLines changed, might need to generate images
    onDidChangeTextEditorSelection      if totalLines changed, might need to generate images and setLeftDecorations for new lines
    onDidChangeTextEditorVisibleRanges  setLeftDecorations
    
    setLeftDecorations      if ABS, set decor for visibleRanges globally; 
                            if REL, set decor for visibleRanges w.r.t activeLine; 
    setRightDecorations     set VSCode lineNumbers setting
    

    number i (digit shown) -> decorationMap -> TextEditorDecorationType w/ .png to show
                           -> decorationRanges -> Range[] w/ lines to show this digit
*/
'use strict';
import * as vscode from 'vscode';
import { generateImages, OUT_DIR } from "./generateImages";

const RESIZE_FACTOR = 2;
const MAX_ICONS_DEFAULT = 10;
const UNDEF = -1;

const SHOW_LEFT_COL = 'vscode-double-line-numbers_showLeftCol';
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
        context.globalState.update(MAX_ICONS, MAX_ICONS_DEFAULT);
        console.log("debug: maxIcons reset to " + context.globalState.get(MAX_ICONS));
        // context.globalState.update(SHOW_LEFT_COL, ABS);
        // showLeftCol = ABS;
        // console.log("debug: showLeftCol set to " + context.globalState.get(SHOW_LEFT_COL));
    }   

    function init() {
        decorationMap = new Map();
        decorationRanges = new Map();
        showLeftCol = context.globalState.get(SHOW_LEFT_COL) || vscode.TextEditorLineNumbersStyle.Off;
        
        switch (editorConfiguration.get("lineNumbers")) {
            case 'off':
                showRightCol = vscode.TextEditorLineNumbersStyle.Off;
                break;
            case 'on':
                showRightCol = vscode.TextEditorLineNumbersStyle.On;
                break;
            case 'relative':
                showRightCol = vscode.TextEditorLineNumbersStyle.Relative;
                break;
        }

        maxIcons = context.globalState.get(MAX_ICONS) || MAX_ICONS_DEFAULT;
        
        generateImages(0, maxIcons);
        loadImages(0, maxIcons);

        setLeftDecorations();
        setRightDecorations();
    }

    // Seems like onDidChangeTextEditorVisibleRanges is triggered before the two others
    // So we might have to update maxIcons here too? Seem unnecessary
    vscode.window.onDidChangeTextEditorVisibleRanges(() => {
        // works now without calling generateImages with RESIZE_FACTOR == 2
        setLeftDecorations();
    });

    // for switching editor to a long file
    // calculate file length and generate more images if needed
    vscode.window.onDidChangeActiveTextEditor(() => {
        // switching editor works with RESIZE_FACTOR == 2
        // works now because of changes elsewhere
        // wasn't working, had duplicate numbers
        var editor = vscode.window.activeTextEditor;
        if (!editor) return;
        var totalLines = editor.document.lineCount;
        if(RESIZE_FACTOR * totalLines > maxIcons) {
            generateImages(maxIcons, RESIZE_FACTOR * totalLines);
            loadImages(maxIcons, RESIZE_FACTOR * totalLines);
            maxIcons = RESIZE_FACTOR * totalLines;
            context.globalState.update(MAX_ICONS, maxIcons);
        }
        setLeftDecorations();
    });

    // when selecting other lines and in relative mode, set left column
    // this method doesn't trigger upon entering another editor
    vscode.window.onDidChangeTextEditorSelection(() => {
        // single editor works now with RESIZE_FACTOR == 2
        // works now because of changes elsewhere
        // wasn't working, had duplicate numbers
        var editor = vscode.window.activeTextEditor;
        if (!editor) return;
        var totalLines = editor.document.lineCount;
        if(RESIZE_FACTOR * totalLines > maxIcons) {
            generateImages(maxIcons, RESIZE_FACTOR * totalLines);
            loadImages(maxIcons, RESIZE_FACTOR * totalLines);
            maxIcons = RESIZE_FACTOR * totalLines;
            context.globalState.update(MAX_ICONS, maxIcons);
        }

        // TODO: might need to add if (totalLines changed)? might be redundant
        setLeftDecorations();
    });


    vscode.commands.registerCommand("vscode-double-line-numbers.abs_rel", () => {
        showLeftCol = vscode.TextEditorLineNumbersStyle.On;
        showRightCol = vscode.TextEditorLineNumbersStyle.Relative;
        setLeftDecorations();	
        setRightDecorations();	
    });

    vscode.commands.registerCommand("vscode-double-line-numbers.rel_abs", () => {
        showLeftCol = vscode.TextEditorLineNumbersStyle.Relative;
        showRightCol = vscode.TextEditorLineNumbersStyle.On;
        setLeftDecorations();	
        setRightDecorations();	
    });

    vscode.commands.registerCommand("vscode-double-line-numbers.abs", () => {
        showLeftCol = vscode.TextEditorLineNumbersStyle.Off;
        showRightCol = vscode.TextEditorLineNumbersStyle.On;
        setLeftDecorations();	
        setRightDecorations();	
    });

    vscode.commands.registerCommand("vscode-double-line-numbers.rel", () => {
        showLeftCol = vscode.TextEditorLineNumbersStyle.Off;
        showRightCol = vscode.TextEditorLineNumbersStyle.Relative;
        setLeftDecorations();	
        setRightDecorations();	
    });

    vscode.commands.registerCommand("vscode-double-line-numbers.off", () => {
        showLeftCol = vscode.TextEditorLineNumbersStyle.Off;
        showRightCol = vscode.TextEditorLineNumbersStyle.Off;
        setLeftDecorations();	
        setRightDecorations();	
    });

    function clearLeftDecorations() {
        var editor = vscode.window.activeTextEditor!;
        if (!editor) return;
        for (const [key, value] of decorationMap.entries()) {
            editor.setDecorations(value, []);
        }
    }

    // Sets Decorations On Left Column 
    function setLeftDecorations(): void {
        console.log("IN setLeftDecorations, maxIcons : " + maxIcons)
        // always clear all existing decor; seem to work for switching modes
        clearLeftDecorations();
        // update global storage
        switch (showLeftCol) {
            case vscode.TextEditorLineNumbersStyle.Off:
                context.globalState.update(SHOW_LEFT_COL, vscode.TextEditorLineNumbersStyle.Off);
                break;
            case vscode.TextEditorLineNumbersStyle.On:
                context.globalState.update(SHOW_LEFT_COL, vscode.TextEditorLineNumbersStyle.On);
                break;
            case vscode.TextEditorLineNumbersStyle.Relative:
                context.globalState.update(SHOW_LEFT_COL, vscode.TextEditorLineNumbersStyle.Relative);
                break;
        }

        var editor = vscode.window.activeTextEditor!;
        if (!editor) return;
        // if(showLeftCol == OFF) {  // redundant
        //     // TODO: always clear all existing decor first???
        //     // decorations.forEach((d) => {
        //     //     editor.setDecorations(d, []);
        //     // });
        //     for (const [key, value] of decorationMap.entries()) {
        //         editor.setDecorations(value, []);
        //     }
        // } else 
        if(showLeftCol == vscode.TextEditorLineNumbersStyle.On) {
            var visibleStart = editor.visibleRanges[0].start.line;
            var visibleEnd = editor.visibleRanges[0].end.line;

            // console.log("visible: " + visibleStart + " ~ " + visibleEnd);

            for(var i = visibleStart; i <= visibleEnd; ++i){
                // var rangesForDecoration: vscode.Range[] = [new vscode.Range(i, 0, i, 0)];
                // var range = decorationRanges.get(i+1);
                // if(!range) continue;  // ???
                var decor = decorationMap.get(i+1);
                if(!decor) continue;  // seem to work
                
                var range = [new vscode.Range(i, 0, i, 0)]; 
                decorationRanges.set(i+1, range);
                
                // console.log(range === decorationRanges.get(i+1))
            
                editor.setDecorations(decor, range);
            }


            // var totalLines = editor.document.lineCount;
            

            // for(var i = 1; i <= maxIcons && i <= totalLines; ++i) {
            //     var rangesForDecoration: vscode.Range[] = [new vscode.Range(i-1, 0, i-1, 0)];
            //     editor.setDecorations(decorations[i], rangesForDecoration);
            // }

        } else if(showLeftCol == vscode.TextEditorLineNumbersStyle.Relative) {
            // TODO: need to clear other keys ???
            var activeLine = editor.selection.active.line;
            var visibleStart = editor.visibleRanges[0].start.line;
            var visibleEnd = editor.visibleRanges[0].end.line;

            // editor.setDecorations(decorations.get(getImagePath(activeLine)), []);
            
            // console.log("visible: " + visibleStart + " ~ " + visibleEnd);

            // 0.png is blank for i == activeLine
            for(var i = visibleStart; i <= visibleEnd; ++i){
                // if(i == activeLine) continue;
                
                var decor = decorationMap.get(Math.abs(activeLine - i));
                if(!decor) continue;  // seem to work
                

                // IMPORTANT: if the same number shows on two lines (activeLine between visibleStart and visibleEnd),
                // we must use one rangesForDecoration for them, otherwise the latter one overwrites the first
                var range = [new vscode.Range(i, 0, i, 0)];  
                // reflect i across activeLine
                if(visibleStart <= 2*activeLine - i && 2*activeLine - i <= visibleEnd) {
                    range.push(new vscode.Range(2*activeLine - i, 0, 2*activeLine - i, 0));
                }
                decorationRanges.set(Math.abs(activeLine - i), range);
                
                // console.log(range === decorationRanges.get(Math.abs(activeLine - i)))
            
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
            case vscode.TextEditorLineNumbersStyle.Off:
                editorConfiguration.update("lineNumbers", "off", vscode.ConfigurationTarget.Global);
                break;
            case vscode.TextEditorLineNumbersStyle.On:
                editorConfiguration.update("lineNumbers", "on", vscode.ConfigurationTarget.Global);
                break;
            case vscode.TextEditorLineNumbersStyle.Relative:
                editorConfiguration.update("lineNumbers", "relative", vscode.ConfigurationTarget.Global);
                break;
        }
    }

    function loadImages(start : number, end : number)/*: vscode.TextEditorDecorationType[] */{
       for (var i = start; i <= end; i++) {
            if(!decorationMap.has(i))
                decorationMap.set(i,
                    vscode.window.createTextEditorDecorationType({
                        gutterIconPath: getImagePath(i), // path.join(__dirname, "..", "images", i.toString() + ".png"),
                        gutterIconSize: "cover",
                    })
                )

            if(!decorationRanges.has(i))
                decorationRanges.set(i, <vscode.Range[]>[]);
        }
    }

    // helper
    function getImagePath(i : number) {
        return OUT_DIR + i.toString() + ".png";
    }
}

export function deactivate() {}
