import fs from "fs";
import { RouteItem, RouteItemObjectModel } from "./route-item";
import { HttpRequest } from "../http-request";
import { HttpResponse } from "../http-response";
import { ControllerLoader } from "../../controller-loader";
import { HttpController } from "../http-controller";
import { Config } from "../../config";
import { XssInjection } from "../security/xss-injection";
import { defaulNotFoundPage } from "../default-error-pages";

/**
 * mvc4node router
 */
export class Router {
  /**
   * Routes table collection
   */
  public static routesTable: {[key: string]: RouteItem} = {};
  
  /**
   * Register a route into the routes table collection
   * @param   routeName     Name of the route to add
   * @param   newRouteItem  Route to add
   */
  public static register(routeName: string, newRouteItem: RouteItem) {
    Router.routesTable[routeName] = newRouteItem;
  }

  /**
   * Load routes from a JSON file
   * @param jsonFilePath Path of the JSON file to load
   */  
  public static loadRoutesFromJson(jsonFilePath: string) {
    let jsonRoutes: any = JSON.parse(fs.readFileSync(jsonFilePath, { encoding: "utf8" }));
    Router.loadRoutesFromObject(jsonRoutes);
  }

  /**
   * Load routes from an object
   * @param inputRoutesArray Path of the JSON file to load
   */  
  public static loadRoutesFromObject(inputRoutesObject: {[key: string]: RouteItemObjectModel}) {
    for(let [routeName,routeObject] of Object.entries(inputRoutesObject)) {
      Router.register(routeName, RouteItem.fromObject(routeObject));
    }
  }
  
  /**
   * Render a route
   * @param   routeName    Name of the route to render
   * @param   request      HTTP request
   * @param   response     Response to the HTTP server
   * @returns              Route rendering result
   */
  public static async renderRoute(routeName: string, request: HttpRequest, response: HttpResponse) {
    // Try to get the given route
    if(!(routeName in Router.routesTable)) {
      throw new Error("Unable to find the " + routeName + " route in the routes table.");
    }
    let route = Router.routesTable[routeName];
    
    // Add the defaults parameters if needed
    if(route.defaultsParameters) {
      for(let paramKey in route.defaultsParameters) {
        if(!(paramKey in request.routeParameters) ? true : request.routeParameters[paramKey] === undefined) {
          request.routeParameters[paramKey] = route.defaultsParameters[paramKey];
        }
      }
    }

    // Try to instanciate the controller
    let controllerCstr = ControllerLoader.getControllerCstr(route.controllerIdentifier);
    let controller = new controllerCstr();
    if(!(controller instanceof HttpController)) {
      throw new Error("The " + route.controllerIdentifier + " controller must inherit from the HttpController class.");
    }
    
    // Check if the given action exists
    if(!(route.action in controller)) {
      throw new Error("The " + route.controllerIdentifier + " controller doesn't contain the method " + route.action + ".");
    }
    let beforeExecuteActionResult = await controller.beforeExecuteAction();
    // Initialization success
    if(!beforeExecuteActionResult.cancelActionExecution) {
      // We have to execute the action
      let execResult: string|Buffer|null|undefined = await (<any>controller)[route.action](request, response);
      return execResult;
    }
    else {
      // We don't have to execute the action
      return null;
    }
  }
  
  /**
   * Render an URL
   * @param   url          URL to render
   * @param   request      HTTP request
   * @param   response     Response to the HTTP server
   * @returns              URL rendering result
   */
  public static async renderUrl(url: string, request: HttpRequest, response: HttpResponse) {
    // Clean URL
    url = url.split("?")[0];
    
    // Check if the given URL is a direct action call
    if(url.startsWith(Config.directActionCallUrlPrefix)) {
      // Direct action call, extract controller identifier and method
      let rxActionCallResult = /^\/(.+?)\.(.+?)$/.exec(url.replace(Config.directActionCallUrlPrefix, "/"));
      if(rxActionCallResult === null) {
        throw new Error("The given url doesn't match the direct action call protocol (" + Config.directActionCallUrlPrefix + "Identifier/Of/The/Controller.method).");
      }
      let controllerIdentifier: string = rxActionCallResult[1];
      let method: string = rxActionCallResult[2];

      // Try to instanciate the controller
      let controllerCstr = ControllerLoader.getControllerCstr(controllerIdentifier);
      let controller = new controllerCstr();
      if(!(controller instanceof HttpController)) {
        throw new Error("The " + controllerIdentifier + " controller must inherit from the Web/HttpController class.");
      }
      
      // Check if the given action exists
      if(!(method in controller)) {
        throw new Error("The " + controllerIdentifier + " controller doesn't contain the method " + method + ".");
      }
      let beforeExecuteActionResult = await controller.beforeExecuteAction();
      if(!beforeExecuteActionResult.cancelActionExecution) {
        // We have to execute the action, check if this method accepts a direct action call
        if(!controller.isDirectActionCallAllowed(method)) {
          throw new Error("The method " + controllerIdentifier + "." + method + " doesn't accept direct action call.");
        }
        
        // Execute the action
        let execResult: string|Buffer|null|undefined = await (<any>controller)[method](request, response);
        return execResult;
      }
      else {
        // We don't have to execute action
        return null;
      }
    }
    
    // Check each key of the routes table to find the one that matches with the given URL
    for (let routeName in Router.routesTable) {
      let route = Router.routesTable[routeName];
      let rxUrlTesterResult = (new RegExp(route.pattern)).exec(url);
      if (rxUrlTesterResult !== null &&
          (route.httpVerbs == "*" || route.httpVerbs.split(",").indexOf(request.method) >= 0)) {
        // Extract the route parameters
        for(let paramKey in rxUrlTesterResult.groups) {
          request.routeParameters[paramKey] = rxUrlTesterResult.groups[paramKey];
        }

        // Look for a XSS injection attempt
        XssInjection.preventInjection(request.routeParameters);
        
        // The route pattern and the method matche with the given URL, 
        return await Router.renderRoute(routeName, request, response);
      }
    }
    
    // No route found, display a not found message/route
    response.httpResult = 404;
    if(Config.notFoundRouteName !== null) {
      // Not found route defined, render it
      request.routeParameters['url'] = url;
      return await Router.renderRoute(Config.notFoundRouteName, request, response);
    }
    else {
      // No route to render, display a simple not found message
      if(Config.debug) {
        let notfoundPageContent = defaulNotFoundPage;
        notfoundPageContent = notfoundPageContent.replace("##url##", XssInjection.escapeHtml(url + ""));
        response.contentType = "text/html; chartset=" + Config.encoding;
        return notfoundPageContent;
      }
      else {          
        return "Runtime error";
      }
    }
  }
}
