/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/

/**
 *
 * Global objects. Handles global operations; clearing js console history commands,
 * turning on/off debug statements, copying history commands, help info, etc.
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {
	return function(GEPPETTO) {

		var debugMode = false;
		var $ = require('jquery'),
		React = require('react'),
        ClipboardModal = require('jsx!components/popups/ClipboardModal');

		/**
		 * @exports geppetto-objects/G
		 */
		GEPPETTO.G = {
			listeners:[],
			selectionOptions : {
				show_inputs : true,
				show_outputs : true,
				draw_connection_lines : true,
				hide_not_selected : false
			},
			highlightedConnections : [],
			addWidget: function(type) {
				var newWidget = GEPPETTO.WidgetFactory.addWidget(type);
				return newWidget;
			},

			/**
			 * Gets list of available widgets
			 *
			 * @command G.availableWidgets()
			 * @returns {List} - List of available widget types
			 */
			availableWidgets: function() {
				return GEPPETTO.Widgets;
			},

			/**
			 * Clears the console history
			 *
			 * @command G.clear()
			 */
			clear: function() {
				GEPPETTO.Console.getConsole().clear();
				return GEPPETTO.Resources.CLEAR_HISTORY;
			},

			/**
			 * Copies console history to OS clipboard
			 *
			 * @command G.copyHistoryToClipboard()
			 */
			copyHistoryToClipboard: function() {

				var commandsString = "";
				var commands = GEPPETTO.Console.consoleHistory();

				if(!commands || !commands.length) {
					return GEPPETTO.Resources.EMPTY_CONSOLE_HISTORY;
				}

				for(var i = 0; i < commands.length; i++) {
					var n = commands[i];
					if(n.command) {

						var command = n.command.trim();
						if(command.indexOf(";") == -1) {
							command = command + ";";
						}

						commandsString += command;
						if(i != commands.length - 1) {
							commandsString += '\n';
						}
					}
				}

				if(commandsString) {
					var message = GEPPETTO.Resources.COPY_TO_CLIPBOARD_WINDOWS;

					//different command for copying in macs means different message
					if(navigator.userAgent.match(/(Mac|iPhone|iPod|iPad)/i)) {
						message = GEPPETTO.Resources.COPY_TO_CLIPBOARD_MAC;
					}

					 React.renderComponent(ClipboardModal({
		                    show: true,
		                    keyboard: false,
		                    title: message,
		                }), document.getElementById('modal-region'));

					$('#javascriptEditor').on('shown.bs.modal', function() {
						if($("#javascriptEditor").hasClass("in")){
							GEPPETTO.JSEditor.loadEditor();
							GEPPETTO.JSEditor.loadCode(commandsString);
						}
					});

					return GEPPETTO.Resources.COPY_CONSOLE_HISTORY;
				}
				else {
					return '';
				}

			},
			/**
			 * Toggles debug statement on/off
			 *
			 * @command G.debug(toggle)
			 * @param toggle - toggles debug statements
			 *
			 */
			debug: function(mode) {
				debugMode = mode;

				if(mode) {
					GEPPETTO.toggleStats(true);
					return GEPPETTO.Resources.DEBUG_ON;
				}
				else {
					GEPPETTO.toggleStats(false);
					return GEPPETTO.Resources.DEBUG_OFF;
				}
			},

			/**
			 * Get all commands and descriptions available for object G.
			 *
			 * @command G.help()
			 * @returns {String} All commands and descriptions for G.
             */
			help: function() {
				return GEPPETTO.Utility.extractCommandsFromFile("assets/js/geppetto-objects/G.js", GEPPETTO.G, "G");
			},
			
			setIdleTimeOut : function(timeOut){
				GEPPETTO.Main.idleTime = timeOut;
			},

			/**
			 * Removes widget from Geppetto
			 *
			 * @command G.removeWidget(widgetType)
			 * @param {WIDGET_EVENT_TYPE} type - Type of widget to remove fro GEPPETTO
			 */
			removeWidget: function(type) {
				return GEPPETTO.WidgetFactory.removeWidget(type);
			},

			/**
			 * Takes the URL corresponding to a script, executes
			 * commands inside the script.
			 *
			 * @command G.runScript(scriptURL)
			 * @param {URL} scriptURL - URL of script to execute
			 */
			runScript: function(scriptURL) {

				GEPPETTO.MessageSocket.send("get_script", scriptURL);

				return GEPPETTO.Resources.RUNNING_SCRIPT;
			},

			/**
			 * Show or hide console using command
			 *
			 * @command G.showConsole(mode)
			 * @param {boolean} mode - "true" to show, "false" to hide.
			 */
			showConsole: function(mode) {
				var returnMessage;

				if(mode) {
					returnMessage = GEPPETTO.Resources.SHOW_CONSOLE;
				}
				else {
					returnMessage = GEPPETTO.Resources.HIDE_CONSOLE;
				}

				GEPPETTO.Console.showConsole(mode);

				return returnMessage;
			},
			
			/**
			 * Show or hide share bar
			 *
			 * @command G.showShareBar(mode)
			 * @param {boolean} mode - "true" to show, "false" to hide.
			 */
			showShareBar: function(mode) {
				var returnMessage;

				if(mode) {
					returnMessage = GEPPETTO.Resources.SHOW_SHAREBAR;
					
					//show share bar
					if(!GEPPETTO.Share.isVisible()){
						$("#geppetto-share").toggleClass("clicked");
						$("#geppetto-share").slideToggle();
						GEPPETTO.Share.setVisible(mode);
					}
					//share bar is already visible, nothing to see here
					else{
						returnMessage = GEPPETTO.Resources.SHAREBAR_ALREADY_VISIBLE;
					}
				}
				else {
					returnMessage = GEPPETTO.Resources.SHOW_SHAREBAR;					
					//hide share bar
					if(GEPPETTO.Share.isVisible()){
						$("#geppetto-share").toggleClass("clicked");
						$("#geppetto-share").slideToggle();
						GEPPETTO.Share.setVisible(mode);
					}
					//share bar already hidden
					else{
						returnMessage = GEPPETTO.Resources.SHAREBAR_ALREADY_HIDDEN;
					}
				}				

				return returnMessage;
			},
			
			/**
			 * Show or hide help window using command
			 *
			 * @command G.showHelpWindow(mode)
			 * @param {boolean} mode - "true" to show, "false" to hide.
			 */
			showHelpWindow: function(mode) {
				var returnMessage;

				if(mode) {
	                GEPPETTO.trigger('simulation:show_helpwindow');
					returnMessage = GEPPETTO.Resources.SHOW_HELP_WINDOW;
				}
				else {	                
					var modalVisible = $('#help-modal').hasClass('in');
					//don't try to hide already hidden help window
					if(!modalVisible){
						returnMessage = GEPPETTO.Resources.HELP_ALREADY_HIDDEN;
					}
					//hide help window
					else{
		                GEPPETTO.trigger('simulation:hide_helpwindow');
						returnMessage = GEPPETTO.Resources.HIDE_HELP_WINDOW;
						$('#help-modal').modal('hide');
					}
				}
				return returnMessage;
			},
			
			/**
			 * Opens window to share geppetto on twitter
			 * @command G.shareOnTwitter()
			 */
			shareOnTwitter : function(){
				var shareURL = 'http://geppetto.org';

				//TODO: How to share experiment on twitter? Used to be Sim URL
				//shareURL = "http://live.geppeto.org//?sim=" + GEPPETTO.Simulation.simulationURL;

				GEPPETTO.Share.twitter(shareURL,'Check out Geppetto, the opensource simulation platform powering OpenWorm!');
			
				return GEPPETTO.Resources.SHARE_ON_TWITTER;
			},
			
			/**
			 * Opens window to share facebook on twitter
			 * 
			 * @command - G.shareOnFacebook()
			 */
			shareOnFacebook : function(){
				var shareURL = 'http://geppetto.org';
				
				//TODO: How to share experiment url in FB, used to be simulation URL
				//shareURL = "http://live.geppeto.org/?sim=" + GEPPETTO.Simulation.simulationURL;
				
				GEPPETTO.Share.facebook(shareURL,'Check out Geppetto, the opensource simulation platform powering OpenWorm!','http://www.geppetto.org/images/sph9.png','');			
				
				return GEPPETTO.Resources.SHARE_ON_FACEBOOK;
			},
			
			/**
			 * Shows a popup widget, used to display a message. 
			 * 
			 * @param {Integer} x - x coordinate of popup widget position
			 * @param {Integer} y - y coordinate of popup widget position
			 * @param {Strin} message - Message to display inside widget 
			 */
			showPopup : function(x,y,message){
				var newWidget = GEPPETTO.WidgetFactory.addWidget(GEPPETTO.Widgets.POPUP);
				newWidget.setPosition(x,y);
				newWidget.setMessage(message);
				newWidget.show();
			},

			/**
			 *
			 * Waits certain amount of time before running next command. Must be
			 * used inside a script.
			 *
			 * @command G.wait(ms)
			 */
			wait: function() {
				return GEPPETTO.Resources.INVALID_WAIT_USE;
			},

			/**
			 * Waits some amount of time before executing a set of commands
			 *
			 * @command G.wait(commands,ms)
			 * @param {Array} commands - Array of commands to execute
			 * @param {Integer} ms - Milliseconds to wait before executing commands
			 */
			wait: function(commands, ms) {
				setTimeout(function() {
					//execute commands after ms milliseconds
					GEPPETTO.ScriptRunner.executeScriptCommands(commands);
				}, ms);

				return GEPPETTO.Resources.WAITING;
			},

			linkDropBox : function(key) {
				if(key!=null || key!=undefined){
					var parameters = {};
					parameters["key"] = key;
					GEPPETTO.MessageSocket.send("link_dropbox", parameters);
					
					return  "Sending request to link dropbox to Geppetto";
				}
				else{
					var dropboxURL = 
						"https://www.dropbox.com/1/oauth2/authorize?locale=en_US&client_id=kbved8e6wnglk4h&response_type=code";
					var win=window.open(dropboxURL, '_blank');
					win.focus();
				}
			},
			
			unLinkDropBox : function() {
				
			},
			
			/**
			 * State of debug statements, whether they are turned on or off.
			 *
			 * @returns {boolean} Returns true or false depending if debug statements are turned on or off.
			 */
			isDebugOn: function() {
				return debugMode;
			},
			
			/**
			 * Resets Camera to initial position - same as after loading.
			 *
			 * @command - G.resetCamera()
			 */
			resetCamera: function() {
				GEPPETTO.resetCamera();
				
				return GEPPETTO.Resources.CAMERA_RESET;
			},
			
			/**
			 * Increments camera pan.
			 *
			 * @command - G.incrementCameraPan()
			 * @param {Integer} x - x coordinate of pan increment vector
			 * @param {Integer} y - y coordinate of pan increment vector
			 */
			incrementCameraPan: function(x, y) {
				GEPPETTO.incrementCameraPan(x, y);
				
				return GEPPETTO.Resources.CAMERA_PAN_INCREMENT;
			},
			
			/**
			 * Increments camera rotation.
			 *
			 * @command - G.incrementCameraRotate()
			 * @param {Integer} x - x coordinate of rotate increment vector
			 * @param {Integer} y - y coordinate of rotate increment vector
			 * @param {Integer} z - z coordinate of rotate increment vector
			 */
			incrementCameraRotate: function(x, y, z) {
				GEPPETTO.incrementCameraRotate(x, y, z);
				
				return GEPPETTO.Resources.CAMERA_ROTATE_INCREMENT;
			},
			
			/**
			 * Increments camera zoom.
			 *
			 * @command - G.incrementCameraZoom()
			 * @param {Integer} z - z coordinate for zoom increment vector
			 */
			incrementCameraZoom: function(z) {
				GEPPETTO.incrementCameraZoom(z);
				
				return GEPPETTO.Resources.CAMERA_ZOOM_INCREMENT;
			},
			
			/**
			 * Callback to be called whenever a watched node changes
			 *
			 * @param {VariableNode} varnode - VariableNode to couple callback to
			 * @param {Function} callback - Callback function to be called whenever _variable_ changes
			 */
			addOnNodeUpdatedCallback: function(varnode, callback) {
				this.listeners[varnode.getInstancePath()] = callback;
			},
			
			/**
			 * Clears callbacks coupled to changes in a node 
			 * 
			 * @param {VariableNode} varnode - VariableNode to which callbacks are coupled
			 */
			clearOnNodeUpdateCallback: function(varnode) {
				this.listeners[varnode.getInstancePath()] = null;
			},
			
			/**
			 * Modulates the brightness of an aspect visualization, given a watched node
			 * and a normalization function. The normalization function should receive
			 * the value of the watched node and output a number between 0 and 1,
			 * corresponding to min and max brightness. If no normalization function is
			 * specified, then brightness = value
			 * 
			 * @param {AspectNode} aspect - Aspect which contains the entity to be lit
			 * @param {String} objectReference - objectReference
			 * @param {VariableNode} modulation - Variable which modulates the brightness
			 * @param {Function} normalizationFunction
			 */
			addBrightnessFunction: function(aspect,modulation,normalizationFunction) {
				this.addOnNodeUpdatedCallback(modulation, function(varnode,step){
			    	GEPPETTO.SceneController.lightUpEntity(aspect.getInstancePath(),
			    			normalizationFunction ? normalizationFunction(varnode.getTimeSeries()[step].getValue()) : varnode.getTimeSeries()[0].getValue());
				});
			},

			clearBrightnessFunctions: function(varnode) {
				this.clearOnNodeUpdateCallback(varnode);
			},
			
			/**
			 * Dynamically change the visual representation of an aspect,
			 * modulated by the value of a watched node. The _transformation_
			 * to be applied to the aspect visual representation should be a
			 * function receiving the aspect and the watched node's value,
			 * which can be normalized via the _normalization_ function. The
			 * latter is a function which receives the watched node's value
			 * an returns a float between 0 and 1.
			 * 
			 * @param {AspectNode} visualAspect - Aspect which contains the VisualizationTree with the entity to be dynamically changed
			 * @param {String} visualEntityName - Name of visual entity in the visualAspect VisualizationTree
			 * @param {VariableNode} dynVar - Dynamical variable which will modulate the transformation
			 * @param {Function} transformation - Transformation to act upon the visualEntity, given the modulation value
			 * @param {Function} normalization - Function to be applied to the dynamical variable, normalizing it to a suitable range according to _transformation_
			 */	
			addDynamicVisualization: function(visualAspect, visualEntityName, dynVar, transformation, normalization){
				//TODO: things should be VisualizationTree centric instead of aspect centric...  
		    	this.addOnNodeUpdatedCallback(dynVar, function(watchedNode){
		    		transformation(visualAspect, visualEntityName, normalization ? normalization(watchedNode.getTimeSeries()[0].getValue()) : watchedNode.getTimeSeries()[0].getValue());});
			},

			/**
			 * Sets options that happened during selection of an entity. For instance, 
			 * user can set things that happened during selection as if connections inputs and outputs are shown,
			 * if connection lines are drawn and if other entities that were not selected are still visible.
			 * 
			 * @param {Object} options - New set of options for selection process
			 */
			setOnSelectionOptions : function(options){
				if(options.show_inputs != null){
					this.selectionOptions.show_inputs = options.show_inputs;
				}
				if(options.show_outputs != null){
					this.selectionOptions.show_outputs = options.show_outputs;
				}
				if(options.draw_connection_lines != null){
					this.selectionOptions.draw_connection_lines = options.draw_connection_lines;
				}
				if(options.hide_not_selected != null){
					this.selectionOptions.hide_not_selected = options.hide_not_selected;
				}
			},
			
			/**
			 * Options set for the selection event, turning on/off connections and lines.
			 * 
			 * @returns {Object} Options for selection.
			 */
			getSelectionOptions : function(){
				return this.selectionOptions;
			},
			
			/**
			 * Unselects all selected entities
			 * 
			 * @command Simulation.unSelectAll()
			 */
			unSelectAll : function(){
				var selection = this.getSelection();
				if(selection.length > 0){
					for(var key in selection){
						var entity = selection[key];
						entity.unselect();
					}
				}
				
				return GEPPETTO.Resources.UNSELECT_ALL;
			},
			
			/**
			 * Show unselected entities, leaving selected one(s) visible.
			 * 
			 * @param {boolean} mode - Toggle flag for showing unselected entities.
			 */
			showUnselected : function(mode){
				var selection = this.getSelection();
				var visible = {};
				for(var e in selection){
					var entity = selection[e];
					var connections = entity.getConnections();
					for(var c in connections){
						var con = connections[c];
						visible[con.getEntityInstancePath()] = "";
					}
				}
				this.toggleUnSelected(this.runTimeTree, mode,visible);
			},
			
			/**
			 *
			 * Outputs list of commands with descriptions associated with the Simulation object.
			 *
			 * @command GEPPETTO.Simulation.getSelection()
			 * @returns  {Array} Returns list of all entities selected
			 */
			getSelection : function() {
				var selection = this.traverseSelection(window.Project.runTimeTree);
				
				return selection;
			},

			/**
			 * Unhighlight all highlighted connections
			 * 
			 * @command Simulation.unHighlightAll()
			 */
			unHighlightAll : function(){
				for(var hc in this.highlightedConnections){
					this.highlightedConnections[hc].highlight(false);
				}
				
				return GEPPETTO.Resources.HIGHLIGHT_ALL;
			},
			
			/**
			 * Helper method that traverses through run time tree looking for selected 
			 * entities.
			 */
			traverseSelection : function(entities){
				var selection = new Array();
				for(var e in entities){
					var entity = entities[e];
					if(entity.selected){
						if(entity.getEntities().length==0){
							selection[selection.length] = entity;
						}
					}
					if(entity.getEntities().length >0){
						selection = selection.concat(this.traverseSelection(entity.getEntities()));
					}
				}

				return selection;
			},
		};
	};
});
