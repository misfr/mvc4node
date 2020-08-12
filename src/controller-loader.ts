/**
 * Controller loading engine
 * @author Frederic BAYLE
 */
export class ControllerLoader {
  /**
   * Loaded controllers
   */
  protected static _loadedControllers: {[key: string]: () => any} = {};

  /**
   * Register a controller into the ControllerLoader collection
   * @param controllerIdentifier  Identifier of the controller to register (ex : Name/Of/The/Controller)
   * @param controllerCstr        Controller class to instanciate
   */
  public static register(controllerIdentifier: string, controllerCstr: () => any) {
    ControllerLoader._loadedControllers[controllerIdentifier] = controllerCstr;
  }

  /**
   * Get controller constructor using its identifier
   * @param     controllerIdentifier   Identifier of the controller (ex : Name/Of/The/Controller)
   * @returns                          Controller class to instanciate
   */
  public static getControllerCstr(controllerIdentifier: string): any {
    if(!(controllerIdentifier in ControllerLoader._loadedControllers)) {
      throw new Error("Unable to find the controller module " + controllerIdentifier + ".");
    }
    return ControllerLoader._loadedControllers[controllerIdentifier];
  }
}
