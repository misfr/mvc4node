/**
 * Route item data model
 * @author Frederic BAYLE
 */
export type RouteItemObjectModel = {
  action: string,
  controllerIdentifier: string,
  defaultParameters?: any,
  httpVerbs?: string,
  pattern: string
};

/**
 * Route item class
 * @author Frederic BAYLE
 */
export class RouteItem {

  /**
   * Action to execute in the given controller
   */
  public action: string;
  
  /**
   * Identifier of the controller to instanciate
   */
  public controllerIdentifier: string;
  
  /**
   * Defaults parameters to pass to the action
   */
  public defaultsParameters?: any;
  
  /**
   * Coma separated HTTP verbs that will trig this route, * = all
   * ex : GET,POST,PUT,DELETE,PATCH
   */
  public httpVerbs: string = "*";

  /**
   * Regular expression pattern used to test if this route item matches with the given URL
   */
  public pattern: string;
  
  /**
   * Class contructor
   * @param   pattern               Pattern used to test if this route item matches with the given URL
   * @param   controllerIdentifier  Identifier of the controller class to instanciate
   * @param   action                Action to execute
   * @param   httpVerbs             HTTP verbs that will trig this route
   * @param   defaultParameters     Associative array containing the default parameters to pass to the action
   */
  constructor(pattern: string, controllerIdentifier: string, action: string, httpVerbs?: string, defaultParameters?: any) {
    this.pattern = pattern;
    this.controllerIdentifier = controllerIdentifier;
    this.action = action;
    this.httpVerbs = httpVerbs || "*";
    this.defaultsParameters = defaultParameters;
  }

  /**
   * Create a RouteItem instance from an object
   * @param     inputObject  Object to convert to a RouteItem instance
   * @returns                RouteItem instance
   */
  public static fromObject(inputObject: RouteItemObjectModel): RouteItem {
    let returnValue = new RouteItem(
      inputObject.pattern, 
      inputObject.controllerIdentifier, 
      inputObject.action, 
      inputObject.httpVerbs || "*", 
      inputObject.defaultParameters
    );
    return returnValue;
  }
}
