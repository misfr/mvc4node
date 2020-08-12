/** 
 * Class that represents a cookie
 * @author  Frederic BAYLE
 */
export class HttpCookie {
  /**
   * Name of the cookie
   */
  protected _name: string;

  /**
   * Hosts to which the cookie will be sent (if undefined, current host is used)
   */
  public domain: string | undefined = undefined;

  /**
   * Maximum lifetime of the cookie
   */
  public expires: Date | undefined = undefined;

  /**
   * HTTP-only cookies aren't accessible via JavaScript
   */
  public httpOnly: boolean = false;

  /**
   * Number of seconds until the cookie expires
   */
  public maxAge: number | undefined = undefined;

  /**
   * URL path that must exist in the requested resource before sending the Cookie
   */
  public path: string = "/";

  /**
   * Flag that determines whether the cookie will only be sent to the server when a request is made using SSL and the HTTPS protocol
   */
  public secure: boolean = false;

  /**
   * Value of the cookie
   */
  public value: string;

  /**
   * Class constructor
   * @param name  Name of the cookie
   * @param value Value of the cookie
   */
  constructor(name: string, value: string) {
    this._name = name;
    this.value = value;
  }

  /**
   * Get the name of the cookie
   * @returns Name of the cookie
   */
  public get name(): string { 
    return this._name; 
  }
}
