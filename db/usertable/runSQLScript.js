import fs from 'fs';
import { connection } from '../connection.js';
export const runSQLScript = async (scriptPath) => {
  try {
    const connectionsql = await connection();
    const sql = fs.readFileSync(scriptPath, 'utf8');
    await connectionsql.query(sql);
    console.log('User Table Created successfully!');
    connectionsql.end();
  } catch (error) {
    console.error('Error executing script:', error);
    throw error;
  }
};