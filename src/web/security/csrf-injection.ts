import { HttpRequest } from "../http-request";

/**
 * CSRF Injection utility class
 * @author Frederic BAYLE
 */
export class CsrfInjection {
  /**
   * HTTP request
   */
  protected _request: HttpRequest;

  /**
   * Class constructor
   * @param     request    HTTP Request
   * @returns              CRSF token  
   */
  constructor(request: HttpRequest) {
    this._request = request;
  }

  /**
   * Check a CSRF token validity
   * @returns True on success, otherwise false
   */
  public checkCsrfToken(): boolean {
    let now:number = Date.now();
    let returnValue: boolean = false;
    let tokenToCheck: string = "";

    if("HTTP_CSRFTOKEN" in this._request.headers) {
      // Search in the request headers
      tokenToCheck = this._request.headers['HTTP_CSRFTOKEN'];
    } 
    else if('__csrfToken' in this._request.form) {
      // We must search token in the POST
      tokenToCheck = this._request.form['__csrfToken'];
    }

    // Compare tokens and check validity
    if(tokenToCheck != "" && "__csrfToken" in this._request.session && "__csrfTokenValidity" in this._request.session) {
      let tokenValidity: number = this._request.session['__csrfTokenValidity'];
      if(tokenToCheck == this._request.session['__csrfToken'] && tokenValidity >= now) {
        returnValue = true;
      }
    }

    return returnValue;
  }

  /**
   * Generate a CSRF token
   * @returns CRSF token  
   */
  public generateCsrfToken(): string {
    let now:number = Date.now();

    if("__csrfToken" in this._request.session && "__csrfTokenValidity" in this._request.session) {
      // if a token exists in the current session, check its validity
      let tokenValidity: number = this._request.session['__csrfTokenValidity'];
      if(tokenValidity >= now) {
        // Current token is valid, add 30min of validity and return it
        this._request.session['__csrfTokenValidity'] = now + 1800000; // h + 30min
        return this._request.session['__csrfToken'];
      }
    }

    // We must generate a new token
    let token = Math.round(Math.random() * Math.pow(10, 20)).toString(36) + Date.now().toString(36);

    // Save token into the session stated
    this._request.session['__csrfToken'] = token;
    this._request.session['__csrfTokenValidity'] = now + 1800000; // h + 30min

    return token;
  }
}
