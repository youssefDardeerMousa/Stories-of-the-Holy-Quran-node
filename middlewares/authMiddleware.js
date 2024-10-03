import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/customError.js';

// Middleware for authentication
export const Isauthenticate = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new CustomError('No token provided', 401);
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;  // Attach the decoded token to the request
  } catch (error) {
    throw new CustomError('Invalid token', 401);
  }
};