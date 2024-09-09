export const Isauthorize = (roles = []) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        throw new CustomError('Forbidden: Access denied', 403);
      }
      next();
    };
  };
  