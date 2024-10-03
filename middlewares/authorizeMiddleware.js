import { CustomError } from '../utils/customError.js';
export const Isauthorize = (roles = []) => {
  return (req) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomError('Forbidden: Access denied', 403);
    }
  };
};