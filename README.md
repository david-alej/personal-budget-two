# Personal Budget II

In this project, I extended my previous GitHub project called 'Personal Budget' to create a Database to keep track of data for the API, connect the API to a Database, and document the API using Swagger.This API is for a personal Budget that follows the principles of Envelope Budgeting to manage personal finnances better. In this api you can create, review, update and delete digital envelopes and your transactions of using the money allocated on the envelopes.

## Features

In my project I made a changeable limit to the total money you can allocate to the envelopes and the money you can spent as shown by the diagram below:

## How to use

To use first download the files, and install the dependencies. Dependencies include:

- morgan
- body-parser
- express
- Mocha
- Chai
- Sinon
- pg

Next we will create the database where the api stores information by first loggging into a superuser on postgres to create a login user with a name of 'budgeteer' and password of 'password'. Then logout of the super superuser to log into the new user just made to create a database named budget_api, connect to the new database, and enter the queries in the repository file "./server/db/db.js" to create the neccesary tables. Keep in mind the choosing of the database user, their password, and database name can be to your choosing but you will have to change the corresponding credentials on the Pool function of top of the repository file './server/db/db.js'.

Then you can run the api typing 'npm start' on the directory of this project.

## Technologies

These are the technologies and/or frameworks used:

- Postgres - used this reltaional database to store the data
- Express.js - used this framework to create the api
- Node.js - used this Javascript runtime to write helper functions and connect to my database
- Visual studio code - used it as my code editor and test endpoints by uisng Thunder Client extension

## Collaborators

I had no collaborators

## License

MIT license

This is showed on the text file "LICENSE.txt" in the repository.
