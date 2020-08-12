/**
 * MVC engine main class module
 * @author Frederic BAYLE
 */

import fs from "fs";
import http from 'http';
import path from 'path';
import mime from "mime-types";
import { Config } from "./config";
import { HttpRequest } from './web/http-request';
import { HttpResponse } from './web/http-response';
import { Router } from './web/routing/router';
import { ControllerLoader } from './controller-loader';
import { ControllerBase } from './controller-base';
import { HttpSessionState } from './web/http-session-state';
import { HttpException } from "./web/http-exception";
import { XssInjection } from './web/security/xss-injection';

/** 
 * Available MVC engine modes
 */
export enum MvcEngineMode {
  Cli = 0,
  Web = 1
}

/**
 * MVC engine main class
 */
export class MvcEngine {

  /**
   * Mode of the MVC engine
   */
  public static mode: MvcEngineMode = MvcEngineMode.Cli;

  /**
   * Property that stores the instance of the HTTP server
   */
  protected static _httpServer: http.Server|null = null;

  /** 
   * Display the command line help
   */
  public static displayHelp() {
    console.log("mvc4node usage :");
    console.log("Open a terminal at the application root directory.");
    console.log("node [appEntryPoint].js command [param1] [param2]...");
    console.log("");
    console.log("Available commands :");
    console.log(" - server:start                            Start the HTTP server that will serve your application");
    console.log(" - script:execute Path/Controller.Method   Execute a script from a controller class method");
    console.log(" - help                                    Display this message");
  }

  /**
   * Execute a script
   * @returns Execution result
   */
  public static async executeScript() {
    if (process.argv.length < 4) {
      MvcEngine.displayHelp();
      return 0;
    }

    // Try to instanciate the controller
    let rxActionCallResult = /^(.+?)\.(.+?)$/.exec(process.argv[3]);
    if(rxActionCallResult === null) {
      throw new Error("Unable to determine the controller name. Desired format : Identifier/Of/The/Controller.method.");
    }
    let controllerIdentifier: string = rxActionCallResult[1];
    let method: string = rxActionCallResult[2];

    // Try to instanciate the controller
    let controllerCstr: any = ControllerLoader.getControllerCstr(controllerIdentifier);
    let controller: any = new controllerCstr();
    if(!(controller instanceof ControllerBase)) {
      throw new Error("The " + controllerIdentifier + " class must inherit from the ControllerBase class.");
    }
    
    // Check if the given action exists
    if(!(method in controller)) {
      throw new Error("The class doesn't contain the method " + method + ".");
    } 
    let beforeExecuteActionResult = await controller.beforeExecuteAction();
    if(!beforeExecuteActionResult.cancelActionExecution) {
      // We have to execute the action, check if this method accepts a direct action call
      if(!controller.isDirectActionCallAllowed(method)) {
        // Direct action call not allowed, reject
        throw new Error("The method " + controllerIdentifier + "." + method + " doesn't accept direct action call.");
      }

      let execResult: number|null|undefined = await (<any>controller)[method]();
      return execResult||0;
    }
    else {
      // We don't have to execute the action
      return 0;
    }
  }

  /** 
   * Start the engine
   */
  public static start() {
    if (process.argv.length < 3) {
      MvcEngine.displayHelp();
      return;
    }

    // Determine command
    if (process.argv[2] == "server:start") {
      // HTTP server mode
      MvcEngine.mode = MvcEngineMode.Web;
      MvcEngine.startHttpServer();
    }
    else {
      // CLI mode
      MvcEngine.mode = MvcEngineMode.Cli;
      MvcEngine.startCli()
        .then(result => process.exit(result||0))
        .catch(cliError => {
          // Cli error, display error and exit node
          console.log(cliError);
          process.exit(-1);
        });
    }
  }

  /** 
   * Start the cli engine
   * @returns Cli result
   */
  public static async startCli() {
    // Parsing arguments
    switch (process.argv[2]) {
      case 'script:execute':      // Execute a script from a class method
        return await MvcEngine.executeScript();

      case 'help':
      default:                    // Unknown command, display help
        MvcEngine.displayHelp();
        return 0;
    }
  }

  /**
   * Start the web server
   */
  public static startHttpServer() {
    // Create the session storage path if needed
    if(Config.sessionMode == 2 /* Session mode = File */) {
      let sessionFilePath: string = Config.mapPath(Config.sessionFilePath);
      if(!fs.existsSync(sessionFilePath)) {
        fs.mkdirSync(sessionFilePath, { recursive: true });
      }
    } 

    // Start the session garbage collector if needed
    let sessionGCHandle: NodeJS.Timeout|undefined = undefined;
    if(Config.sessionMode != 0 /* Session = ON */) {
      sessionGCHandle = setInterval(() => {
        HttpSessionState.garbageCollect();
      }, 60000);
    }

    this._httpServer = http.createServer((nodeReq: http.IncomingMessage, nodeRes: http.ServerResponse) => {
      let request = new HttpRequest(nodeReq);
      let response = new HttpResponse(nodeRes);

      // Restore session
      request.session = new HttpSessionState(request, response);

      // Try to prevent XSS injections
      try {
        XssInjection.preventInjection(request.queryString);
        XssInjection.preventInjection(request.form);
      }
      catch (error) {
        // Handle errors
        HttpException.throwException(request, response, error);
        return;
      }

      // Data chunk receiving event
      let incomingData: any[] = [];
      let postMaxSizeErrorOccured: boolean = false;
      nodeReq.on("data", data => {
        if (postMaxSizeErrorOccured) {
          return; // An error occured, cancel
        }

        // Add chunk to the request body
        incomingData.push(data);
        if (Buffer.concat(incomingData).length > Config.postMaxSize) {
          // Size limit exeeded, cancel
          postMaxSizeErrorOccured = true;
          return;
        }
      });

      // Data receiving end event 
      nodeReq.on("end", () => {
        // Data received or no data
        try {
          if (postMaxSizeErrorOccured) {
            throw new Error("The maximum amount of POST data has been exceeded.");
          }

          // Parse the request body if needed
          if (incomingData.length > 0) {
            request.parseRequestBody(Buffer.concat(incomingData).toString("binary"));
          }

          // Try to compute the real path of the given URL on the server
          let urlRealPath = Config.mapPath("@" + request.rawUrl).split('?')[0];
          if (fs.existsSync(urlRealPath) ? fs.statSync(urlRealPath).isFile() : false) {
            // The real path is an existing file on the server, send it to the reponse
            response.contentType = mime.contentType(path.extname(urlRealPath)) || "application/octet-stream";
            fs.createReadStream(urlRealPath).pipe(response.serverResponse);
          }
          else {
            // The real path isn't a file on the server, routes the given url
            Router.renderUrl(request.rawUrl, request, response).then((result) => {
              if(result) {
                response.write(result);
              }
              response.end();
            }).catch((renderError) => {
              HttpException.throwException(request, response, renderError);
            });
          }
        }
        catch (error) {
          // Handle errors
          HttpException.throwException(request, response, error);
        }
      });

      // Response closed event
      nodeRes.on("close", () => {
        // Updating session data
        request.session.update();
      });
      
    }).on("close", () => {
      // HTTP server closed event
      if(sessionGCHandle) {
        // Set the session garbage collector off if needed
        clearInterval(sessionGCHandle);
      }
      console.log("HTTP server stopped.");
    });

    this._httpServer.listen(
      {
        host: Config.serverHost,
        port: Config.serverPort
      }, 
      () => {
        console.log("HTTP server listening on port " + Config.serverPort + (Config.debug ? " (Debug mode)" : "") + ".");
      }
    );
  }

  /**
   * Stop the web server
   */
  public static stopHttpServer() {
    this._httpServer?.close();
    this._httpServer = null;
  }
}
