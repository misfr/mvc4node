import { HttpRequest } from "./http-request";
import { HttpResponse } from "./http-response";
import { Config } from "../config";
import { Router } from "./routing/router";
import { defaulErrorPage } from "./default-error-pages";
import { XssInjection } from "./security";

/**
 * HTTP exception
 * @author Frederic BAYLE
 */
export class HttpException {
  /**
   * Throw an exception
   * @param request    HTTP request
   * @param response   Server response
   * @param err        Message / error
   */
  public static throwException(request: HttpRequest, response: HttpResponse, err: string|Error) {
    // handle errors
    try {
      if(err instanceof Error) {
        throw err;
      }
      else {
        throw new Error(err.toString());
      }
    }
    catch(error) {
      response.httpResult = 500;
      if(Config.errorRouteName !== null) {
        // Not found route defined, render it
        request.routeParameters['error'] = error;
        Router.renderRoute(Config.errorRouteName, request, response).then(result => {
          if(result) {
            response.write(result);
          }
          response.end();
        }).catch(renderError => {
          // Display default error to prevent infinite loop
          if(Config.debug) {
            let errorPageContent = defaulErrorPage;
            errorPageContent = errorPageContent.replace("##message##", XssInjection.escapeHtml(renderError + ""));
            errorPageContent = errorPageContent.replace("##stack##", XssInjection.escapeHtml(renderError.stack ? (renderError.stack + "") : "No stack information available"));
            response.contentType = "text/html; chartset=" + Config.encoding;
            response.write(errorPageContent);
          }
          else {          
            response.write("Runtime error");
          }
          response.end();
        });
      }
      else {
        // No route to render, display a simple error message
        if(Config.debug) {
          let errorPageContent = defaulErrorPage;
          errorPageContent = errorPageContent.replace("##message##", XssInjection.escapeHtml(error + ""));
          errorPageContent = errorPageContent.replace("##stack##", XssInjection.escapeHtml(error.stack ? (error.stack + "") : "No stack information available"));
          response.contentType = "text/html; chartset=" + Config.encoding;
          response.write(errorPageContent);
        }
        else {          
          response.write("Runtime error");
        }
        response.end();
      }
    }
  }
}
