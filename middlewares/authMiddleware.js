import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/customError.js';

export const Isauthenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new CustomError('No token provided', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    throw new CustomError('Invalid token', 401);
  }
};
