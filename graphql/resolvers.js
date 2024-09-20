import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/customError.js';
import { connection } from '../db/connection.js';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_cloudname,
  api_key: process.env.CLOUDINARY_apikey,
  api_secret: process.env.CLOUDINARY_apisekret,
});

// Function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, picture: user.picture },
    process.env.JWT_SECRET
  );
};

// Function to store token in the database
const storeToken = async (userId, token) => {
  const conn = await connection();
  await conn.execute('INSERT INTO user_tokens (user_id, token) VALUES (?, ?)', [userId, token]);
};

export const resolvers = {
  Query: {
    getUsers: async () => {
      try {
        const conn = await connection();
        const [users] = await conn.query('SELECT * FROM users');
        return users;
      } catch (error) {
        throw new CustomError('Failed to fetch users', 500);
      }
    },
    getUser: async (_, { id }) => {
      try {
        const conn = await connection();
        const [user] = await conn.query('SELECT * FROM users WHERE id = ?', [id]);

        if (user.length === 0) {
          throw new CustomError('User not found', 400);
        }

        return user[0];
      } catch (error) {
        throw new CustomError('Failed to fetch user', 500);
      }
    },
  },

  Mutation: {
    addUser: async (_, { name, email, password, role, picture }) => {
      try {
        const conn = await connection();
        const [existingUser] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
          throw new CustomError('Email already exists', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await conn.query(
          'INSERT INTO users (name, email, password, role, picture) VALUES (?, ?, ?, ?, ?)',
          [name, email, hashedPassword, role || 'user', picture || 'https://res.cloudinary.com/dhbl4eauf/image/upload/v1720194161/1000_F_349497933_Ly4im8BDmHLaLzgyKg2f2yZOvJjBtlw5_fylttm.jpg']
        );

        const newUser = { id: result.insertId, name, email, role: role || 'user', picture: picture || 'https://res.cloudinary.com/dhbl4eauf/image/upload/v1720194161/1000_F_349497933_Ly4im8BDmHLaLzgyKg2f2yZOvJjBtlw5_fylttm.jpg' };
        const token = generateToken(newUser);
        await storeToken(newUser.id, token);

        return { user: newUser, token };
      } catch (error) {
        throw new CustomError('Failed to add user', 500);
      }
    },

    updateProfilePicture: async (_, { id, picture }) => {
      try {
        const conn = await connection();
        const [userCheck] = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
        
        if (userCheck.length === 0) {
          throw new CustomError('User not found', 404);
        }

        // Upload the new picture to Cloudinary
        const result = await cloudinary.uploader.upload(picture, {
          folder: 'user_pictures',
        });

        // Update the user's profile picture in the database
        await conn.query('UPDATE users SET picture = ? WHERE id = ?', [result.secure_url, id]);

        const [updatedUser] = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
        return updatedUser[0];
      } catch (error) {
        throw new CustomError('Failed to update profile picture', 500);
      }
    },

    deleteProfilePicture: async (_, { id }) => {
      try {
        const conn = await connection();
        const [userCheck] = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
    
        if (userCheck.length === 0) {
          throw new CustomError('User not found', 404);
        }
    
        // Set the default picture URL
        const defaultPicture = 'https://res.cloudinary.com/dhbl4eauf/image/upload/v1720194161/1000_F_349497933_Ly4im8BDmHLaLzgyKg2f2yZOvJjBtlw5_fylttm.jpg';
        
        // Update the user's profile picture in the database to the default picture
        await conn.query('UPDATE users SET picture = ? WHERE id = ?', [defaultPicture, id]);
    
        const [updatedUser] = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
        return updatedUser[0];
      } catch (error) {
        throw new CustomError('Failed to delete profile picture', 500);
      }
    }
    
  },
};
