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
 * Handles incoming messages associated with Simulation
 */
define(function(require) {
	return function(GEPPETTO) {

		var updateTime = function(time) {
			if(time) {
				GEPPETTO.Simulation.time.value = time.value;
				GEPPETTO.Simulation.time.unit = time.unit;
			}
		};
		
		var createTime = function(time) {
			if(time) {
				var node =
					{id:"time", name : "name", value : time.value , unit: time.unit,
					 instancePath : "time",
					 _metaType : GEPPETTO.Resources.VARIABLE_NODE};
				var timeNode = 
					GEPPETTO.NodeFactory.createVariableNode(node);
				GEPPETTO.Simulation.time = timeNode;
			}
		};


        var messageTypes = {
            /*
             * Messages handle by SimulatorHandler
             */
            LOAD_MODEL: "load_model",
            SCENE_UPDATE: "scene_update",
            SIMULATION_CONFIGURATION: "simulation_configuration",
            SIMULATION_LOADED: "simulation_loaded",
            SIMULATION_STARTED: "simulation_started",
            SIMULATION_PAUSED: "simulation_paused",
            SIMULATION_STOPPED: "simulation_stopped",
            LIST_WATCH_VARS: "list_watch_vars",
            LIST_FORCE_VARS: "list_force_vars",
            GET_WATCH_LISTS: "get_watch_lists",
            SIMULATOR_FULL: "simulator_full",
            SET_WATCH_VARS: "set_watch_vars",
            START_WATCH: "start_watch",
            STOP_WATCH: "stop_watch",
            CLEAR_WATCH: "clear_watch",
            FIRE_SIM_SCRIPTS: "fire_sim_scripts",
            SIMULATION_OVER : "simulation_over",
            GET_MODEL_TREE : "get_model_tree"
        };

        var messageHandler = {};

        messageHandler[messageTypes.LOAD_MODEL] = function(payload) {
        	var initTime = new Date()-GEPPETTO.Simulation.initializationTime;
        	
            GEPPETTO.Console.debugLog(GEPPETTO.Resources.LOADING_MODEL + " took: " + initTime + " ms.");
            var jsonRuntimeTree = JSON.parse(payload.update).scene;

            var startCreation = new Date();
            GEPPETTO.RuntimeTreeController.createRuntimeTree(jsonRuntimeTree);
            var endCreation = new Date() - startCreation;
            GEPPETTO.Console.debugLog("It took " + endCreation + " ms to create runtime tree");
            GEPPETTO.Console.debugLog(GEPPETTO.NodeFactory.nodes + " total nodes created, from which: "+
            						  GEPPETTO.NodeFactory.entities + " were entities and "+
            						  GEPPETTO.NodeFactory.connections + " were connections");
            GEPPETTO.Simulation.setSimulationLoaded();
            
            //Populate scene
            GEPPETTO.SceneController.populateScene(GEPPETTO.Simulation.runTimeTree); 
            
            GEPPETTO.trigger('simulation:modelloaded');
        };

        messageHandler[messageTypes.SCENE_UPDATE] = function(payload) {
            var updatedRunTime = JSON.parse(payload.update).scene;
            updateTime(updatedRunTime.time);

            GEPPETTO.RuntimeTreeController.updateRuntimeTree(updatedRunTime);

            //Update if simulation hasn't been stopped
            if(GEPPETTO.Simulation.status != GEPPETTO.Simulation.StatusEnum.STOPPED && GEPPETTO.isCanvasCreated()) {
                if(!GEPPETTO.isScenePopulated()) {
                    // the first time we need to create the objects
                    GEPPETTO.SceneController.populateScene(GEPPETTO.Simulation.runTimeTree);
                }
                else {
                    // any other time we just update them
                    GEPPETTO.SceneController.updateScene(GEPPETTO.Simulation.runTimeTree);
                }
            }
        };

        messageHandler[messageTypes.SIMULATION_CONFIGURATION] = function(payload) {            
            GEPPETTO.trigger('simulation:configloaded', payload.configuration);

        };

        messageHandler[messageTypes.SIMULATION_LOADED] = function() {
            GEPPETTO.trigger('simulation:loaded');
        };

        messageHandler[messageTypes.FIRE_SIM_SCRIPTS] = function(payload) {
            //Reads scripts received for the simulation
            var scripts = JSON.parse(payload.get_scripts).scripts;

            //make sure object isn't empty
            if(!jQuery.isEmptyObject(scripts)) {
                //run the received scripts
                GEPPETTO.ScriptRunner.fireScripts(scripts);
            }
        };

        //Simulation has been started, enable pause button
        messageHandler[messageTypes.SIMULATION_STARTED] = function(payload) {
        	var updatedRunTime = JSON.parse(payload.update).scene;
            createTime(updatedRunTime.time);

            GEPPETTO.RuntimeTreeController.updateRuntimeTree(updatedRunTime);

            //Update if simulation hasn't been stopped
            if(GEPPETTO.Simulation.status != GEPPETTO.Simulation.StatusEnum.STOPPED && GEPPETTO.isCanvasCreated()) {
                if(!GEPPETTO.isScenePopulated()) {
                    // the first time we need to create the objects
                    GEPPETTO.SceneController.populateScene(GEPPETTO.Simulation.runTimeTree);
                }
                else {
                    // any other time we just update them
                    GEPPETTO.SceneController.updateScene(GEPPETTO.Simulation.runTimeTree);
                }
            }
                       
            GEPPETTO.trigger('simulation:started');
        };

        messageHandler[messageTypes.SIMULATION_STOPPED] = function(payload) {
            GEPPETTO.trigger('simulation:stopped');
        };

        messageHandler[messageTypes.SIMULATION_PAUSED] = function(payload) {
            GEPPETTO.trigger('simulation:paused');
        };

        messageHandler[messageTypes.LIST_WATCH_VARS] = function(payload) {
            GEPPETTO.Console.debugLog(GEPPETTO.Resources.LISTING_WATCH_VARS);
            // TODO: format output
            formatListVariableOutput(JSON.parse(payload.list_watch_vars).variables, 0);
        };

        messageHandler[messageTypes.LIST_FORCE_VARS] = function(payload) {
            GEPPETTO.Console.debugLog(GEPPETTO.Resources.LISTING_FORCE_VARS);
            // TODO: format output
            formatListVariableOutput(JSON.parse(payload.list_force_vars).variables, 0);
        };

        messageHandler[messageTypes.GET_WATCH_LISTS] = function(payload) {
            GEPPETTO.Console.debugLog(GEPPETTO.Resources.LISTING_FORCE_VARS);
            GEPPETTO.Console.log(payload.get_watch_lists);
        };

        messageHandler[messageTypes.SIMULATOR_FULL] = function(payload) {
            GEPPETTO.FE.disableSimulationControls();
        	GEPPETTO.FE.infoDialog(GEPPETTO.Resources.SIMULATOR_FULL, payload.message);
        };

        messageHandler[messageTypes.SET_WATCH_VARS] = function(payload) {
            //variables watching
            var variables = JSON.parse(payload.get_watch_lists)[0].variablePaths;

            var length = GEPPETTO.Simulation.simulationStates.length;

            //create objects for the variables to watch
            for(var v in variables) {
                GEPPETTO.Simulation.simulationStates[length] = variables[v];
                length++;
            }
        };

        //handles the case where simulation is done executing all steps
        messageHandler[messageTypes.SIMULATION_OVER] = function() {
            //Updates the simulation controls visibility
        	GEPPETTO.Console.executeCommand("Simulation.stop()");
        };

        //received model tree from server
        messageHandler[messageTypes.GET_MODEL_TREE] = function(payload) {
        	var update = JSON.parse(payload.get_model_tree);      
        	for (var updateIndex in update){
	        	var aspectInstancePath = update[updateIndex].aspectInstancePath;
	        	var modelTree = update[updateIndex].modelTree;
	        	
	        	//create client side model tree
	        	GEPPETTO.RuntimeTreeController.populateAspectModelTree(aspectInstancePath, modelTree.ModelTree);
        	}
        };





		GEPPETTO.SimulationHandler = {
			onMessage: function(parsedServerMessage) {
				// parsed message has a type and data fields - data contains the payload of the message
				// Switch based on parsed incoming message type
                if(messageHandler.hasOwnProperty(parsedServerMessage.type)) {
                    messageHandler[parsedServerMessage.type](JSON.parse(parsedServerMessage.data));
                }
			},

			onParticlesUpdate: function(particlePositionsArray) {

				var particleCount = particlePositionsArray.length / 3;

				for (var i = 0; i < particleCount; i++) {

					GEPPETTO.SceneFactory.updateParticlePosition(particlePositionsArray, i);

				}






			}

		};

		GEPPETTO.SimulationHandler.MESSAGE_TYPE = messageTypes;
	};









	/**
	 * Utility function for formatting output of list variable operations
	 * NOTE: move from here under wherever it makes sense
	 *
	 * @param vars - array of variables
	 */
	function formatListVariableOutput(vars, indent)
	{
		var formattedNode = null;

		// vars is always an array of variables
		for(var i = 0; i < vars.length; i++) {
			var name = vars[i].name;

			if(vars[i].aspect != "aspect") {
				var size = null;
				if(typeof(vars[i].size) != "undefined") {
					// we know it's an array
					size = vars[i].size;
				}

				// print node
				var arrayPart = (size != null) ? "[" + size + "]" : "";
				var indentation = "   ���";
				for(var j = 0; j < indent; j++) {
					indentation = indentation.replace("���", " ") + "   ��� ";
				}
				formattedNode = indentation + name + arrayPart;

				// is type simple variable? print type
				if(typeof(vars[i].type.variables) == "undefined") {
					// we know it's a simple type
					var type = vars[i].type.type;
					formattedNode += ":" + type;
				}

				// print current node
				GEPPETTO.Console.log(formattedNode);

				// recursion check
				if(typeof(vars[i].type.variables) != "undefined") {
					// we know it's a complex type - recurse! recurse!
					formatListVariableOutput(vars[i].type.variables, indent + 1);
				}
			}
			else {
				formattedNode = name;
				// print current node
				GEPPETTO.Console.log(formattedNode);
			}
		}
	}
});
