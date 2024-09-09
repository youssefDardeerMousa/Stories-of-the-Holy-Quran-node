// src/index.js

import express from 'express';
import dotenv from 'dotenv';
import { ApolloServer } from 'apollo-server-express';
import { resolvers } from './graphql/resolvers.js';
import { typeDefs } from './graphql/userschema.js';
import { appMethods } from './app.methods.js';
import { connection } from './db/connection.js';
import { runSQLScript } from './db/usertable/runSQLScript.js';
import { CustomError } from './utils/customError.js';
import { runSQLScriptTokens } from './db/token table/runSQLScript.js';

dotenv.config();

const app = express();

// Initialize Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (err) => {
    // Check if the error is an instance of CustomError
    const message = err.message || 'Internal server error';
    const statusCode = err.originalError?.statusCode || 500;

    return {
      message,
      statusCode,
    };
  },
  context: ({ req }) => {
    // You can add authentication and other context setup here
    return { req };
  },
});

async function startServer() {
try {
  await server.start();
  server.applyMiddleware({ app });

  // Additional middleware can be added here
  appMethods(app, express);

  // Initialize database connection and run migrations/scripts
  await connection();
  await runSQLScript(process.env.querypath);
  await runSQLScriptTokens(process.env.querytokenpath);
} catch (error) {
  console.error('Failed to start server:', error);
}

 
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
});
