import fs from "fs";
import path from "path";

/**
 * Available encodings
 * @author Frederic BAYLE
 */
export type Encoding = "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";

/**
 * App configuration
 * @author Frederic BAYLE
 */
export class Config {
  /**
   * Custom application settings
   */
  public static appSettings: any = {};

  /**
   * Application root path
   */
  public static appRootPath: string = "./";

  /**
   * Flag that enable the debug mode
   */
  public static debug: boolean = false;

  /**
   * Direct action call URL prefix
   */
  public static directActionCallUrlPrefix: string = "/mvc/action/";

  /**
   * Default encoding
   */
  public static encoding: Encoding = "utf-8";
  
  /**
   * Name of the route to render if an error occurs (500)
   */
  public static errorRouteName: string|null = null;

  /**
   * HTTP headers to add to the server response
   */
  public static httpResponseHeaders: { [key:string]: any } = {
    "X-Powered-By": "mvc4node"
  }
  
  /**
   * Name of the route to render if not found (404)
   */
  public static notFoundRouteName: string|null = null;

  /**
   * POST maximum site (default : 20MB)
   */
  public static postMaxSize: number = 20971520;

  /**
   * HTTP server listening host
   */
  public static serverHost: string = "127.0.0.1";

  /**
   * HTTP server listening port
   */
  public static serverPort: number = 8080;

  /**
   * Session storage mode (default: off)
   */
  public static sessionMode: number = 0;

  /**
   * Session file storage path (mode = file)
   */
  public static sessionFilePath: string = "/tmp";

  /**
   * Session timeout in seconds (default : 2h)
   */
  public static sessionTimeout: number = 7200;

  /**
   * Public HTTP root path
   */
  public static webRootPath: string = "./";

  /**
   * Load configuration values from a JSON file
   * @param jsonFilePath Path of the JSON file to load
   */  
  public static loadFromJson(jsonFilePath: string) {
    // Read JSON data from file
    let jsonConfig: any = JSON.parse(fs.readFileSync(jsonFilePath, { encoding: "utf8" }));

    // Set configuration
    Config.loadFromObject(jsonConfig);
  }
 
  /**
   * Load configuration values from an object
   * @param inputObject Path of the JSON file to load
   */  
  public static loadFromObject(inputObject: any) {
    // Set configuration values
    for(let [configKey, configValue] of Object.entries<any>(inputObject)) {
      (Config as any)[configKey] = configValue;
    }
  }
 
  /**
   * Convert an URL into a path on the server
   * @param     url  URL to convert
   * @returns         Converted URL
   */
  public static mapPath(url: string): string {
    let returnValue: string = "";
    if(url.startsWith('~/')) {
        // Application relative path
        returnValue = url.replace(/^~\//, Config.appRootPath + "/");
    }
    else if(url.startsWith('@/')) {
        // Public web sources relative path
        returnValue = url.replace(/^@\//, Config.webRootPath + "/");
    }
    else {
        // Otherwise, the given url cannot be mapped, returns its original value
        returnValue = url;
    }  
    return path.resolve(returnValue);
  }
}
