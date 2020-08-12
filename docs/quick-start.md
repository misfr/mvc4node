## Quick start

*Note : Examples are written in Typescript but you can transpose it to javascript as you need.*

### Installation

```bash
npm install mvc4node
```

### Basic application example

First create a directory that will contain your application and create the application structure like this :

```
Application root (~/)
│___ src (sources directory)
│___ www (public web root : @/)
```

Then, we need to initialize the project and install dependencies :

```bash
# The following line creates the package.json
npm init
# In this example, we will create a single file application
# We just need to install typescript and mvc4node as dependencies
npm install --save-dev typescript @types/node
npm install mvc4node
# Typescript compiler initialization
./node_modules/.bin/tsc --init
```

Then, you must setup your typescript compiler and set ES2017 or later as target in your `tsconfig.json` configuration file. You can also set an output directory to separate compiled javascript from typescript source files. 

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "outDir": "./dist"
    ...
  },
  include: [
    "./src/**/*.ts"
  ]
}
```

We can write a simple controller that will contain an action that will return a simple Hello World message `/src/home-controller.ts` :

```typescript
import { HttpController, HttpRequest, HttpResponse } from "mvc4node/web";

/**
 * Our simple controller
 */
export class HomeController extends HttpController {
  /**
   * Our simple action
   */
  public async mainView(request: HttpRequest, response: HttpResponse) {
    return "Hello world !!!";
  }
}
```

Then, we need to create the application entry point `/src/index.ts` that will contain the following lines :

```typescript
import path from "path";
import { Config, ControllerLoader, MvcEngine } from "mvc4node";
import { Router, RouteItem } from "mvc4node/web/routing";
import { HomeController } from "./home-controller";

// Configuring the application directories
// !!! Please note that they must be relative to the application root directory
Config.appRootPath = path.resolve("./");
Config.webRootPath = path.resolve("./www");

// Registering controllers
ControllerLoader.register("HomeController", HomeController);

// Registering routes
Router.register("home", new RouteItem("^/(home)?$", "HomeController", "mainView"));

// Starting the HTTP server
MvcEngine.start();
```

Then, we can add scripts to the `package.json`  npm configuration file to be able to easily compile and start our application :

```json
{
  ...
  "scripts": {
    "build": "tsc",
    "start": "node ./dist/index.js server:start"
  },
  ...
}
```

Finally, we can test our first mvc4node application with the following command :

```bash
npm run build
npm start
```

Now, you can open your favorite internet navigator and go to the http://localhost:8080/ url to see the result.
