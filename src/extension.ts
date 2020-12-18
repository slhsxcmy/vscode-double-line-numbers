// FIXME: Missing chunks of numbers (even half of a number) when pasting/entering quickly (before loading finish?); because vscode cannot load image so fast???
// The unloaded image is related to exact numbers, thus switching modes will miss same numbers
// TODO: make sure loadImages have no overlap or reload the same image is OK
// TODO: change theme -> regenerate images
// TODO: save themed images for later
// Fixed: ABS+REL -> REL+ABS some high ABS line numbers remains but can be refreshed if we selected past it: fixed by adding 0
// Fixed: REL+ABS -> ABS+REL give wrong number 0 on the selected line: either not load 0, or call clearLeftDecorations() first
// Fixed: top and bottom of page missing half a line number: check 1 more line in setLeftDecorations
// Known issue: MAX_ICONS_DEFAULT == 1 -> no number shown on startup
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
const MAX_ICONS_DEFAULT = 1000;
const UNDEF = -1;

const SHOW_LEFT_COL = 'vscode-double-line-numbers_showLeftCol';
const MAX_ICONS = 'vscode-double-line-numbers_maxIcons';

/* This extension activates on startup */
export function activate(context: vscode.ExtensionContext) {
    var decorationMap : Map<number, vscode.TextEditorDecorationType>;
    var decorationRanges : Map<number, vscode.Range[]>; 
    var showLeftCol : number = UNDEF;
    var showRightCol : number = UNDEF;
    var maxIcons : number = UNDEF;
    const editorConfiguration = vscode.workspace.getConfiguration("editor");
        
    // debugInit();
    init();
 
    function debugInit() {
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
        if(maxIcons < MAX_ICONS_DEFAULT) {
            maxIcons = MAX_ICONS_DEFAULT;
            context.globalState.update(MAX_ICONS, maxIcons);
        }

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

    // when selecting different lines or creating new lines
    // this method doesn't trigger upon entering another editor
    vscode.window.onDidChangeTextEditorSelection(() => {
        // I think vscode duplicates decor on current selection first before updating any decor, thus a little flashing
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

        // add if(totalLines changed)?? might be redundant
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

    // helper
    function clearLeftDecorations() {
        var editor = vscode.window.activeTextEditor!;
        if (!editor) return;
        for (const [key, value] of decorationMap.entries()) {
            editor.setDecorations(value, []);
        }
    }

    // Sets Decorations On Left Column 
    function setLeftDecorations(): void {
       
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
        //     for (const [key, value] of decorationMap.entries()) {
        //         editor.setDecorations(value, []);
        //     }
        // } else 
        if(showLeftCol == vscode.TextEditorLineNumbersStyle.On) {
            var visibleStart = editor.visibleRanges[0].start.line;
            var visibleEnd = editor.visibleRanges[0].end.line;
            var totalLines = editor.document.lineCount;
            
            //          must check 0                        seem redundant but just be safe
            for(var i = Math.max(visibleStart - 1, 0); i <= Math.min(visibleEnd + 1, totalLines - 1); ++i){
                var decor = decorationMap.get(i+1);
                if(!decor) continue;  // seem to work
                
                var range = [new vscode.Range(i, 0, i, 0)]; 
                decorationRanges.set(i+1, range);
                
                editor.setDecorations(decor, range);
            }

        } else if(showLeftCol == vscode.TextEditorLineNumbersStyle.Relative) {
            var activeLine = editor.selection.active.line;
            var visibleStart = editor.visibleRanges[0].start.line;
            var visibleEnd = editor.visibleRanges[0].end.line;
            var totalLines = editor.document.lineCount;
        
            //          must check 0                        seem redundant but just be safe
            for(var i = Math.max(visibleStart - 1, 0); i <= Math.min(visibleEnd + 1, totalLines - 1); ++i){
                // seems no need to clear other keys
                // 0.png is blank for i == activeLine
                var decor = decorationMap.get(Math.abs(activeLine - i));
                if(!decor) continue;  // seem to work

                // IMPORTANT: if the same number shows on two lines (activeLine between visibleStart and visibleEnd),
                // we must use one rangesForDecoration for them, otherwise the latter one overwrites the first
                var range = [new vscode.Range(i, 0, i, 0)];  
                
                // reflect i across activeLine
                var r = 2*activeLine - i;
                
                //              must check 0                        seem redundant but just be safe
                if(Math.max(visibleStart - 1, 0) <= r && r <= Math.min(visibleEnd + 1, totalLines - 1)) {
                    range.push(new vscode.Range(r, 0, r, 0));
                }
                decorationRanges.set(Math.abs(activeLine - i), range);
                
                editor.setDecorations(decor, range);
            }

        } 
    }

    // Updates "editor.lineNumbers" in settings.json
    function setRightDecorations(): void {
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
       for (var i = start; i < end; i++) {
            
            if(!decorationMap.has(i))  // redundant
                decorationMap.set(i,
                    vscode.window.createTextEditorDecorationType({
                        gutterIconPath: getImagePath(i), 
                        gutterIconSize: "cover",
                    })
                );
            
            // TODO: create when applying decoration?
            if(!decorationRanges.has(i))  // redundant
                decorationRanges.set(i, <vscode.Range[]>[]);
            // else {
            //     var range : vscode.Range[] = decorationRanges.get(i)!;
            //     decorationRanges.set(i, range);
            // }
        }
    }

    // helper
    function getImagePath(i : number) {
        return OUT_DIR + i.toString() + ".png";
    }

    // function refresh(start : number, end : number) {
    //     var editor = vscode.window.activeTextEditor;
    //     if (!editor) return;
        
    //     for (var i = start; i < end; i++) {
    //         decorationMap.set(i,
    //             vscode.window.createTextEditorDecorationType({
    //                 gutterIconPath: getImagePath(i), 
    //                 gutterIconSize: "cover",
    //             })
    //         );
            
    //         var decor = decorationMap.get(i);  // just set
    //         if(!decor) continue;  // seem to work

    //         if(!decorationRanges.has(i))  // redundant
    //             decorationRanges.set(i, <vscode.Range[]>[]);
    //         else {
    //             var range : vscode.Range[] = decorationRanges.get(i)!;
                
    //             editor.setDecorations(decor, range);
    //             decorationRanges.set(i, range);  // redundant???
    //         }

            
    //     }

    //     setLeftDecorations();
    //     setRightDecorations();
    // }


    // vscode.commands.registerCommand("vscode-double-line-numbers.reload", () => {
        
    //     refresh(0, maxIcons);
    //     // init();  // FIXME: duplicates number at selection while entering
    //     // switching to another mode and back works
    //     // for (var i = 0; i < maxIcons; i++) {
            
    //     //         decorationMap.set(i,
    //     //             vscode.window.createTextEditorDecorationType({
    //     //                 gutterIconPath: getImagePath(0), 
    //     //                 gutterIconSize: "cover",
    //     //             })
    //     //         )

    //     // }
    // });

}

export function deactivate() {}
