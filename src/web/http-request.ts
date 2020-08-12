import http from "http";
import qs from "querystring";
import { Config } from "../config";
import { HttpPostedFile } from "./http-posted-file";
import { HttpSessionState } from "./http-session-state";

/**
 * HTTP server request
 * @author Frederic BAYLE
 */
export class HttpRequest {
  /**
   * Request cookies
   */
  protected _cookies: {[key: string]: any} = {};

  /**
   * Posted files collection
   */
  protected _files: {[key: string]: HttpPostedFile} = {};

  /**
   * POST data
   */
  protected _form: {[key: string]: any} = {};

  /**
   * GET data
   */
  protected _queryString: {[key: string]: any} = {};

  /**
   * NodeJs HTTP incoming message
   */
  protected _req: http.IncomingMessage;

  /**
   * Request Time
   */
  protected _requestTime: Date;

  /**
   * Route parameters
   */
  protected _routeParameters: {[key: string]: any} = {};

  /**
   * Session variables
   */
  public session!: HttpSessionState;

  /**
   * Class constructor
   * @param req NodeJS HTTP incoming message
   */
  constructor(req: http.IncomingMessage) {
    this._requestTime = new Date();
    this._req = req;

    // Try to parse the GET parameters
    let qsParameters = this.rawUrl.split("?");
    if(qsParameters.length > 1) {
      this._queryString = qs.parse(qsParameters[1]);;
    }

    // Read cookies
    if("cookie" in this.headers) {
      let rxCookies: RegExp = /(\w+)\s*=\s*([^;]*)/g;
      let rxCookiesResult: RegExpExecArray|null = null;
      while (rxCookiesResult = rxCookies.exec(<string>this.headers["cookie"])) {
        this._cookies[rxCookiesResult[1]] = rxCookiesResult[2];
      }   
    }
  }

  /**
   * Get the request cookies collection
   * @returns Request cookies collection
   */
  public get cookies(): {[key: string]: any} { 
    return this._cookies; 
  }

  /**
   * Get posted files collection
   * @returns Posted files collection
   */
  public get files() : {[key: string]: HttpPostedFile } { 
    return this._files;
  }

  /**
   * Get POST data
   * @returns POST data
   */
  public get form(): {[key: string]: any} { 
    return this._form; 
  }

  /**
   * Get the request headers
   * @returns Request headers
   */
  public get headers(): {[key: string]: any} { 
    return this._req.headers; 
  }

  /**
   * Get NodeJs HTTP incoming message - provided for convenience
   * @returns NodeJS HTTP incoming message
   */
  public get incomingMessage() : http.IncomingMessage {
    return this._req;
  } 

  /**
   * Get the request method
   * @returns Request method
   */
  public get method(): string { 
    return (this._req.method || "GET").toUpperCase(); 
  }

  /** 
   * Parses the request body
   */
  public parseRequestBody(incomingData: string) {
    let contentBuffer: Buffer = Buffer.alloc(0);
    let parsed: boolean = false;
    if("content-type" in this.headers) {
      if((<string>this.headers["content-type"]).toLowerCase().startsWith("application/json")) {
        // JSON data, try to parse it
        contentBuffer = Buffer.from(incomingData, "binary");
        this._form = JSON.parse(contentBuffer.toString(Config.encoding));
        parsed = true;
      }
      else if((<string>this.headers["content-type"]).toLowerCase().startsWith("multipart/form-data")) {
        // Multipart, get boundary
        let rxBoundary:RegExp = /;\s*boundary\s*=\s*([-a-zA-Z0-9]+)/i;
        let rxBoundaryResult: RegExpExecArray|null = rxBoundary.exec(<string>this.headers["content-type"]);
        if(!rxBoundaryResult) {
            throw new Error("Unable to find the multipart/form-data boundary.");
        }
        let boundary: string = "--" + rxBoundaryResult[1];

        // Cleaning data
        let cleanIncomingData = incomingData.replace(boundary + "\r\n", "");
        cleanIncomingData = cleanIncomingData.replace("\r\n" + boundary + "--\r\n", "");
        let postFieldsQS: string = "";

        // For each element
        for (let multipartElement of cleanIncomingData.split("\r\n" + boundary + "\r\n")) {
          let rxNameResult: RegExpExecArray|null = /content-disposition:.*?name="([^"]+)"/i.exec(multipartElement);
          let rxFileNameResult: RegExpExecArray|null = /content-disposition:.*?filename="([^"]+)"/i.exec(multipartElement);
          let rxContentResult: RegExpExecArray|null = /\r\n\r\n([\w\W]*)/.exec(multipartElement);
          if(!rxNameResult) {
            // Name is required
            throw new Error("Unable to find the content-disposition name field in the given multipart/form-data.");
          }
          if(rxContentResult) {
            contentBuffer = Buffer.from(rxContentResult[1], "binary");
          }
          if(rxFileNameResult) {
            // It's a file
            let newPostedFileItem: HttpPostedFile = new HttpPostedFile(Buffer.from(rxFileNameResult[1], "binary").toString(Config.encoding), contentBuffer);
            let contentTypeResult: RegExpExecArray|null = /content-type\s*:\s*(\S+)/i.exec(multipartElement);
            if(contentTypeResult) {
              newPostedFileItem.contentType = Buffer.from(contentTypeResult[1], "binary").toString(Config.encoding);
            }
            this._files[rxNameResult[1]] = newPostedFileItem;
          }
          else {
            // It's a field, store it in the POST parameters
            postFieldsQS += (postFieldsQS == "" ? "" : "&") + rxNameResult[1] + "=" + encodeURIComponent(contentBuffer.toString(Config.encoding));
          }
        }
          
        // Parse post fields
        this._form = qs.parse(postFieldsQS);
        parsed = true;
      }
    }
    
    if(!parsed) {
      // By default, consider that's url encoded content
      contentBuffer = Buffer.from(incomingData, "binary");
      this._form = qs.parse(contentBuffer.toString(Config.encoding));
    }
  }

  /**
   * Get GET data
   * @returns GET data
   */
  public get queryString(): {[key: string]: any} { 
    return this._queryString; 
  }

  /**
   * Get the current URL including GET variables
   * @returns Current URL including GET variables
   */
  public get rawUrl(): string { 
    return <string>this._req.url; 
  }

  /**
   * Get the request time
   */
  public get requestTime(): Date {
    return this._requestTime;
  }

  /**
   * Get the remote IP address
   */
  public get remoteAddress(): string {
    return <string>this._req.connection.remoteAddress;
  }

  /**
   * Get route parameters
   * @returns Route parameters
   */
  public get routeParameters(): {[key: string]: any} { 
    return this._routeParameters; 
  }

  /**
   * Get server variables
   * @returns Server variables
   */
  public get serverVariables(): {[key: string]: any} { 
    return process.env;
  }
}
