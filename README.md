
  # デザイン教員側

  This is a code bundle for デザイン教員側. The original project is available at https://www.figma.com/design/0mr9DT7BNU2E7iUx0iWpwv/%E3%83%87%E3%82%B6%E3%82%A4%E3%83%B3%E6%95%99%E5%93%A1%E5%81%B4.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## ACME Challenge

  Certbot webroot validation requires the following path to be served as a
  plain static file path without SPA fallback:

  `/.well-known/acme-challenge/<token>`

  In this project, files placed under `public/.well-known/acme-challenge/`
  are copied into the build output and can be served statically.

  For production auto-renewal, Certbot should write challenge files to the
  deployed server's actual document root, for example:

  `certbot certonly --webroot -w /path/to/deployed/build -d digitalarchive.space -d www.digitalarchive.space`

  If your web server uses SPA routing, exclude `/.well-known/acme-challenge/`
  from the fallback to `index.html`.
  
