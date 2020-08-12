/**
 * Before execute action event result
 * @author Frederic BAYLE
 */
export class BeforeExecuteActionResult {
  /**
   * Flag that determines whether we should cancel the action execution
   */
  public cancelActionExecution: boolean = false;
};

/**
 * Controller base class
 * @author Frederic BAYLE
 */
export class ControllerBase {
  /**
   * Direct action call allowed methods
   */
  protected _directCallAllowedMethods: string[] = [];

  /**
   * Before execute action event
   * Usage case : You can cancel action execution by overriding this method and adding a reject instruction
   * @returns Before execute action event result
   */
  public async beforeExecuteAction() {
    return new BeforeExecuteActionResult();
  }

  /**
   * Get a flag that determines whether we could authorize a direct action call or not
   * @param     methodName   Name of the method to check
   * @returns                True of direct action call is allowed for the given method, otherwise false
   */
  public isDirectActionCallAllowed(methodName: string) {
    return (this._directCallAllowedMethods.filter(e => e == methodName).length > 0);
  }
}
