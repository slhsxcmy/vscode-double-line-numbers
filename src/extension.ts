'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const MAX_ICONS = 99;
const OFF = 0;
const ABS = 1;
const REL = 2;

export function activate(context: vscode.ExtensionContext) {
	
	var showLeftCol = OFF;
	var showRightCol = OFF;

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

	// TODO
	function setLeftDecorations(): void {
        
	}
	
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
