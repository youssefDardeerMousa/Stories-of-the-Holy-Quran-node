import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/customError.js';
import { connection } from '../db/connection.js';
// Function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role,name:user.name,picture:user.picture },
    process.env.JWT_SECRET
  );
};

// Function to store token in the database
const storeToken = async (userId, token) => {
  const conn = await connection();
  await conn.execute('INSERT INTO user_tokens (user_id, token) VALUES (?, ?)', [userId, token]);
};

// Function to get token by user ID
const getTokenByUserId = async (userId) => {
  const conn = await connection();
  const [rows] = await conn.execute('SELECT token FROM user_tokens WHERE user_id = ?', [userId]);
  return rows.length ? rows[0].token : null;
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
        if (error instanceof CustomError) throw error;
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
        console.error('Error in addUser resolver:', error);
        if (error instanceof CustomError) throw error;
        throw new CustomError('Failed to add user', 500);
      }
    },
    
    updateUser: async (_, { id, name, email, password, role }) => {
      try {
        const conn = await connection();

        // Check if the user exists
        const [userCheck] = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
        if (userCheck.length === 0) {
          throw new CustomError('User not found', 404);
        }

        // Prepare fields for update
        const fields = [];
        const values = [];

        if (name) {
          fields.push('name = ?');
          values.push(name);
        }
        if (email) {
          // Check if email is already taken by another user
          const [existingUser] = await conn.query('SELECT * FROM users WHERE email = ? AND id != ?', [email, id]);
          if (existingUser.length > 0) {
            throw new CustomError('Email already in use by another user', 400);
          }
          fields.push('email = ?');
          values.push(email);
        }
        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          fields.push('password = ?');
          values.push(hashedPassword);
        }
        if (role) {
          fields.push('role = ?');
          values.push(role);
        }

        if (fields.length === 0) {
          throw new CustomError('No fields provided for update', 400);
        }

        values.push(id);
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        await conn.query(sql, values);

        // Return the updated user
        const [updatedUser] = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
        return updatedUser[0];
      } catch (error) {
        if (error instanceof CustomError) throw error;
        throw new CustomError('Failed to update user', 500);
      }
    },

    deleteUser: async (_, { id }) => {
      try {
        const conn = await connection();
        const [userCheck] = await conn.query('SELECT * FROM users WHERE id = ?', [id]);

        if (userCheck.length === 0) {
          throw new CustomError('User not found', 404);
        }

        await conn.query('DELETE FROM users WHERE id = ?', [id]);
        return { message: 'User deleted successfully' };
      } catch (error) {
        if (error instanceof CustomError) throw error;
        throw new CustomError('Failed to delete user', 500);
      }
    },

    loginUser: async (_, { email, password }) => {
      try {
        const conn = await connection();
        const [users] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    
        if (users.length === 0) {
          throw new CustomError('User not found', 404);
        }
    
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
    
        if (!isMatch) {
          throw new CustomError('Invalid email or password.', 400);
        }
    
        const token = generateToken(user);
        await storeToken(user.id, token);
    
        return { user: { ...user, picture: user.picture || 'https://res.cloudinary.com/dhbl4eauf/image/upload/v1720194161/1000_F_349497933_Ly4im8BDmHLaLzgyKg2f2yZOvJjBtlw5_fylttm.jpg' }, token };
      } catch (error) {
        console.error('Error in loginUser resolver:', error);
        if (error instanceof CustomError) throw error;
        throw new CustomError('Failed to login user', 500);
      }
    },
  },
};
