/*******************************************************************************
 * The MIT License (MIT)
 * 
 * Copyright (c) 2011 - 2015 OpenWorm.
 * http://openworm.org
 * 
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *     	OpenWorm - http://openworm.org/people.html
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
package org.geppetto.frontend.server.resource;

import java.util.List;

import org.geppetto.core.data.IGeppettoDataManager;
import org.geppetto.core.data.model.IGeppettoProject;
import org.geppetto.frontend.server.DashboardApplication;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.resource.Get;
import org.restlet.resource.ServerResource;

import com.google.gson.Gson;

public class GeppettoProjectsResource extends ServerResource
{
	@Get("json")
	public String getAllGeppettoProjects()
	{
		DashboardApplication application = (DashboardApplication) getApplication();
		IGeppettoDataManager dataManager = application.getDataManager();
		List<? extends IGeppettoProject> geppettoProjects = dataManager.getAllGeppettoProjects();

		JSONObject result = new JSONObject();
		JSONArray geppettoProjectsArray = new JSONArray();
		try
		{
			for(IGeppettoProject project : geppettoProjects)
			{
				JSONObject projectObject = new JSONObject(new Gson().toJson(project));
				geppettoProjectsArray.put(projectObject);
			}
			result.put("geppetto_projects", geppettoProjectsArray);

			result.put("data_manager", dataManager.getName());
		}
		catch(JSONException e)
		{
			// ignore
		}
		return result.toString();
	}
}