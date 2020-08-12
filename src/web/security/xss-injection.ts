/**
 * Prevents cross side scripting injections
 * @author Frederic BAYLE
 */
export class XssInjection {
  /**
   * Searching for an XSS injection in a var collection (GET, POST...)
   * @param requestData Collection to search in
   */
  public static preventInjection(requestData: any) {
    if (typeof (requestData) == "string") {
      // String, checks it
      if (/<\s*\/?\s*(script|link|form|i?frame|frameset|meta)|\{\{/i.test(requestData)) {
        // Suspicious value detected, error
        throw new Error("XSS injection attempt detected, stopping request processing");
      }
    }
    else if (typeof(requestData) == "object") {
      // Array or object, processing all items
      for (let key in requestData) {
        XssInjection.preventInjection(requestData[key]);
      }
    }
  }

  /**
   * Escape html special chars from a string
   * @param   inputString String to escape
   * @returns             Escaped string
   */
  public static escapeHtml(inputString: string) {
    let replacementTable: {[key: string]: string} = {
      "&": "&amp;",
      "\"": "&quot;",
      "<": "&lt;",
      ">": "&gt;"
    };
    let returnValue = inputString;
    for(let [key,value] of Object.entries(replacementTable)) {
      returnValue = returnValue.replace(new RegExp(key, "g"), value);
    }
    return returnValue;
  }
}
