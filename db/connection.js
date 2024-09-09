import mysql from 'mysql2/promise';
import dotenv from 'dotenv'
dotenv.config()
export const connection = async () => {
  try {
    const connected = await mysql.createConnection({
      host: process.env.host,
      port: process.env.port,
      user: process.env.user,
      password: process.env.password,
      database: process.env.database
    });

    console.log('Connected to MySQL database!');
    
    return connected; 

  } catch (error) {
    console.error('Error connecting to MySQL database:', error);
    throw error; // Re-throw the error for proper handling
  }
};