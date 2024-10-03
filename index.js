// src/index.js

import express from 'express';
import dotenv from 'dotenv';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs as userTypeDefs } from './graphql/userschema.js'; // User schema
import { resolvers as userResolvers } from './graphql/resolvers.js'; // User resolvers
import { typeDefsProphets } from './graphql/prophets.schema.js'; // Prophets schema
import { resolversProphets } from './graphql/prophets.resolvers.js'; // Prophets resolvers
import { appMethods } from './app.methods.js';
import { connection } from './db/connection.js';
import { runSQLScript } from './db/usertable/runSQLScript.js';
import { runSQLScriptTokens } from './db/token table/runSQLScript.js';

dotenv.config();

const app = express();

// First Apollo Server for user-related operations
const userServer = new ApolloServer({
  typeDefs: userTypeDefs,
  resolvers: userResolvers,
  context: ({ req }) => {
    // Context for user authentication/authorization
    return { req };
  },
});

// Second Apollo Server for prophets-related operations
const prophetsServer = new ApolloServer({
  typeDefs: typeDefsProphets,
  resolvers: resolversProphets,
  context: ({ req }) => {
    // Context for prophets' authentication/authorization
    return { req };
  },
});

async function startServer() {
  try {
    await userServer.start();
    userServer.applyMiddleware({ app, path: '/graphql/user' });  // User endpoint

    await prophetsServer.start();
    prophetsServer.applyMiddleware({ app, path: '/graphql/prophets' });  // Prophets endpoint

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
