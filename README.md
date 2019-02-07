# HCL interveiew event project BE

This project covers the BE part of the events project for HCL interview
It is coded with *NodeJS*, *express* and *mongodb*

## Things to improve
 - Separate routes logic into a *routes.js* dir, which can be divided into these as well:
	 - *users.js*
	 - *events.js*
	 - *comments.js*
 - Separate config logic into *config.js*
 - Make a little more functional the way all CRUD functions get the collection object, as it is repeated in all functions
 - Make a little more functional all operations in the API, as logic
 - Put constants
 - Code structure and cleanness
 - Better README :)

## How to run
To run the server

    npm run start
