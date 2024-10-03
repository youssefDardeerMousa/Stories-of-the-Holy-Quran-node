import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.host,
  port: process.env.port,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  waitForConnections: true,
  connectionLimit: 5, 
  queueLimit: 0
});

export const connection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MySQL database!');
    
    return conn; // إعادة الاتصال
  } catch (error) {
    console.log('Error connecting to MySQL database:', error);
    throw error; 
  }
};
 