// server/middleware/roleMiddleware.js

const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      const userRole = user?.role;

      if (!userRole) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!allowedRoles.length || allowedRoles.includes(userRole)) {
        return next();
      }

      return res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions" });
    } catch (err) {
      return res.status(500).json({ message: err.message || "Server error" });
    }
  };
};


module.exports = roleMiddleware;


