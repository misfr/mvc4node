import fs from "fs";
import http from "http";
import { Config } from "../config";
import { HttpCookie } from "./http-cookie";

/**
 * HTTP server response
 * @author Frederic BAYLE
 */
export class HttpResponse {
  /**
   * Cookies collection
   */
  protected _cookies: {[key: string]: HttpCookie} = {};

  /**
   * HTTP reponse headers
   */
  protected _headers: {[key: string]: any} = {
    "Content-Type": "text/html; charset=utf-8"
  };

  /**
   * NodeJs HTTP server response
   */
  protected _res: http.ServerResponse;

  /**
   * HTTP server response result code
   */
  public httpResult: number = 200;

  /**
   * Class constructor
   * @param res NodeJS HTTP server response
   */
  constructor(res: http.ServerResponse) {
    this._res = res;

    // Add custom headers
    this._headers = Object.assign(this._headers, Config.httpResponseHeaders);
  }

  /**
   * Get the HTTP reponse content type
   * @returns HTTP response content type
   */
  public get contentType(): string {
    return this._headers['Content-Type'];
  }
  /**
   * Set the HTTP reponse content type
   * @param value New HTTP response content type
   */
  public set contentType(value: string) {
    this._headers['Content-Type'] = value;
  }

  /**
   * Get HTTP response headers
   * @returns HTTP response headers
   */
  public get headers(): {[key: string]: any} {
    return this._headers;
  }

  /**
   * End the HTTP server response
   */
  public end() {
    if(this._res.finished) {
      return;
    }
    else if(!this._res.headersSent) {
      this.writeHeaders();
    }
    this._res.end(null, "binary");
  }

  /**
   * HTTP redirection
   * @param url Redirection URL
   */
  public redirect(url: string) {
    this.httpResult = 302;  // Temp redirection    
    this.headers['Location'] = url;
  }

  /**
   * Get NodeJs HTTP server response - provided for convenience
   * @returns NodeJs HTTP server response
   */
  public get serverResponse() : http.ServerResponse {
    return this._res;
  }  

  /**
   * Set a cookie to add to the response
   * @param   name       Name of the cookie
   * @param   value      Value of the cookie
   * @param   expires    Maximum lifetime of the cookie
   * @param   maxAge     Number of second until the cookie expires
   * @param   domain     Hosts to which the cookie will be sent (if undefined, current host is used)
   * @param   path       URL path that must exist in the requested resource before sending the Cookie
   * @param   secure     Flag that determines whether the cookie will only be sent to the server when a request is made using SSL and the HTTPS protocol
   * @param   httpOnly   HTTP-only cookies aren't accessible via JavaScript
   */
  public setCookie(name: string, value: string, expires?: Date, maxAge?: number, domain?: string, 
    path?: string, secure?: boolean, httpOnly?: boolean) {
    let newCookie = new HttpCookie(name, value);
    newCookie.expires = expires;
    newCookie.maxAge = maxAge;
    newCookie.domain = domain;
    newCookie.path = path||"/";
    newCookie.secure = secure || false;
    newCookie.httpOnly = httpOnly || false;
    this._cookies[name] = newCookie;
  }

  /**
   * Write a message to the http response
   * @param message Message to write
   */
  public write(message: string|Buffer) {
    if(this._res.finished) {
      return;
    }
    else if(!this._res.headersSent) {
      this.writeHeaders();
    }
    this._res.write(message, Config.encoding);
  }

  /**
   * Write a file content on the HTTP response
   * @param filePath Path of the file to write
   */
  public writeFile(filePath: string) {
    if(this._res.finished) {
      return;
    }
    else if(!this._res.headersSent) {
      this.writeHeaders();
    }

    // Redirect the file stream to the server response
    let fi = fs.openSync(filePath, "r");
    let fiBuffer = Buffer.alloc(102400);  // Chunk size : 100kB
    let bytesRead: number;
    while((bytesRead = fs.readSync(fi, fiBuffer, 0, 102400, null)) > 0) {
        this._res.write(fiBuffer.slice(0, bytesRead), "binary");
        fiBuffer = Buffer.alloc(102400);
    }
    fs.closeSync(fi);
  }

  /**
   * Write headers on the HTTP response
   */
  public writeHeaders() {
    if(this._res.finished) {
      throw new Error("Headers can't be sent, response is ended.");
    }
    else if(this._res.headersSent === true) {
      throw new Error("Headers can't be sent again.");
    }

    // Add cookies to the headers
    let cookiesTable: string[] = [];
    for(let cookieName in this._cookies) {
      let currentCookie = this._cookies[cookieName];
      let cookieHeaderValue = cookieName + "=" + currentCookie.value;
      if(currentCookie.expires !== undefined) {
        cookieHeaderValue += "; Expires=" + (<Date>currentCookie.expires).toUTCString();
      }
      if(currentCookie.maxAge !== undefined) {
        cookieHeaderValue += "; Max-Age=" + currentCookie.maxAge;
      }
      if(currentCookie.domain !== undefined) {
        cookieHeaderValue += "; Domain=" + currentCookie.domain;
      }
      if(currentCookie.path !== undefined) {
        cookieHeaderValue += "; Path=" + currentCookie.path;
      }
      if(currentCookie.secure) {
        cookieHeaderValue += "; Secure";
      }
      if(currentCookie.httpOnly) {
        cookieHeaderValue += "; HttpOnly";
      }
      cookiesTable.push(cookieHeaderValue);
    }
    if(cookiesTable.length > 0) {
      this._res.setHeader("Set-Cookie", cookiesTable);
    }

    // Write headers
    this._res.writeHead(this.httpResult, this._headers);
  }
}
