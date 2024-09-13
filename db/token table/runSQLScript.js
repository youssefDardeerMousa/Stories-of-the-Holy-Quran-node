import fs from 'fs';
import { connection } from '../connection.js';


export const runSQLScriptTokens = async (path) => {
  try {
    const connectionsql = await connection();
    const sql = fs.readFileSync(path, 'utf8');
    
    await connectionsql.query(sql);
    
    console.log('user_tokens table created successfully!');
    connectionsql.end();
  } catch (error) {
    console.log('Error executing script:', error);
    throw error;
  }
};
