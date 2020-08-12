/**
 * Default error page
 * @author Frederic BAYLE
 */
export const defaulErrorPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Runtime error</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      color:#333;
    }
    main {
      margin: 0;
      padding: 15px;
    }
    main > h1 {
      color: #85a038;
      font-weight: bold;
      padding: 0 0 15px 0;
      margin: 0 0 15px 0;
      border-bottom: solid 1px #666;
    }
    main > pre {
      font-family: 'Courier New', Courier, monospace;
      background-color: #eee;
      padding: 15px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <main>
    <h1>Runtime error</h1>
    <p><b>Message :&nbsp;</b>##message##</p>
    <p><b>Stack :</b></p>
    <pre>##stack##</pre>
  </main>
</body>
</html>`;

/**
 * Default not found page
 * @author Frederic BAYLE
 */
export const defaulNotFoundPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page not found</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      color:#333;
    }
    main {
      margin: 0;
      padding: 15px;
    }
    main > h1 {
      color: #85a038;
      font-weight: bold;
      padding: 0 0 15px 0;
      margin: 0 0 15px 0;
      border-bottom: solid 1px #666;
    }
    main > pre {
      font-family: 'Courier New', Courier, monospace;
      background-color: #eee;
      padding: 15px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <main>
    <h1>Page not found</h1>
    <p><b>URL :</b></p>
    <pre>##url##</pre>
  </main>
</body>
</html>`;
