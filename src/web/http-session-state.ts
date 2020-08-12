import fs from "fs";
import { HttpRequest } from "./http-request";
import { HttpResponse } from "./http-response";
import { Config } from "../config";

/**
 * Available session storage modes
 * @author Frederic BAYLE
 */
export enum HttpSessionStateMode {
  Off = 0,
  Memory = 1,
  File = 2
}

/** 
 * HTTP session state class
 * @author Frederic BAYLE
 */
export class HttpSessionState {
  [key: string]: any;

  /**
   * Session data (only used when Config.sessionMode is set to Memory)
   */
  public static __memSessionData: { [keys: string]: { time: number, data: HttpSessionState } } = {};

  /**
   * Gets the current session ID
   */
  public get sessionID(): string { return this._sessionID || ""; }
  protected _sessionID: string | undefined;

  /**
   * Class constructor
   * @param request    HTTP Request
   * @param response   Server response
   */
  constructor(request: HttpRequest, response: HttpResponse) {
    // Session = Off -> cancels initialization
    if (Config.sessionMode == HttpSessionStateMode.Off) {
      return;
    }

    // Look for an existing sessionid cookie
    if ("mvc4n_sessionid" in request.cookies) {
      // A session exists, gets the corresponding ID
      this._sessionID = <string>request.cookies["mvc4n_sessionid"];

      if (Config.sessionMode == HttpSessionStateMode.File) {
        // Session mode = File, checks whether the session data file exists
        let sessionDataFileName = Config.mapPath(Config.sessionFilePath + "/mvc4n_session_" + this._sessionID + ".json");
        if (fs.existsSync(sessionDataFileName) ? fs.statSync(sessionDataFileName).isFile() : false) {
          // Session file exists, imports it
          Object.assign(this, JSON.parse(fs.readFileSync(sessionDataFileName, Config.encoding)));
        }
      }
      else if (Config.sessionMode == HttpSessionStateMode.Memory) {
        // Session mode = Memory, checks whether the session data exists
        if (this._sessionID in HttpSessionState.__memSessionData) {
          // Session data exists, imports it
          Object.assign(this, HttpSessionState.__memSessionData[this._sessionID].data);
        }
      }
    }
    else {
      // No valid session -> creates new one
      this._sessionID = parseInt(request.remoteAddress.replace(/[^0-9]+/g, ''), 10).toString(36) + // Client IP address
        Math.round(Math.random() * Math.pow(10, 20)).toString(36) + // Random seed
        Date.now().toString(36);  // Current time
    }

    // Writes the sessionid cookie
    response.setCookie("mvc4n_sessionid", this._sessionID);
  }

  /**
   * Remove all expired sessions data
   */
  public static garbageCollect() {
    if (Config.sessionMode == HttpSessionStateMode.File) {
      // Session mode = File, clean unused session files
      let sessionFilesPath = Config.mapPath(Config.sessionFilePath);
      let sessionFiles = fs.readdirSync(sessionFilesPath, { 
        encoding: Config.encoding 
      }).filter(
        e => /mvc4n_session_[a-z0-9]+\.json$/i.test(e)
      ).map(e => sessionFilesPath + "/" + e);

      for (let fileItem of sessionFiles) {
        let fileItemStats = fs.statSync(fileItem);
        if ((fileItemStats.mtime.getTime() + (Config.sessionTimeout * 1000)) < Date.now()) {
          fs.unlinkSync(fileItem);
        }
      }
    }
    else if (Config.sessionMode == HttpSessionStateMode.Memory) {
      // Session mode = Memory, clean ununsed variables
      for (let i in HttpSessionState.__memSessionData) {
        if ((HttpSessionState.__memSessionData[i].time + (Config.sessionTimeout * 1000)) < Date.now()) {
          delete HttpSessionState.__memSessionData[i];
        }
      }
    }
  }

  /**
   * Update the current session state
   */
  public update() {
    if (this._sessionID) {
      if (Config.sessionMode == HttpSessionStateMode.File) {
        // Session mode = File, writes session data into it
        fs.writeFileSync(
          Config.mapPath(Config.sessionFilePath + "/mvc4n_session_" + this._sessionID + ".json"), 
          JSON.stringify(this), 
          { encoding: Config.encoding }
        );
      }
      else if (Config.sessionMode == HttpSessionStateMode.Memory) {
        // Session mode = Memory, writes session data into it
        HttpSessionState.__memSessionData[this._sessionID] = {
          time: Date.now(),
          data: Object.assign({}, this)
        }
      }
    }
  }
}
