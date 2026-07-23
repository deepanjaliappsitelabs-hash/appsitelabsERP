
const jwt = require("jsonwebtoken");

const protect = (
  req,
  res,
  next
) => {
  let token =
    req.headers.authorization;

  if (
    token &&
    token.startsWith("Bearer")
  ) {
    try {
      token =
        token.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      req.user = decoded;

      next();
    } catch (error) {
      res.status(401).json({
        message: "Invalid Token",
      });
    }
  } else {
    res.status(401).json({
      message:
        "No Token Provided",
    });
  }
};

const adminOnly = (
  req,
  res,
  next
) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Admin access only",
    });
  }

  next();
};

module.exports = {
  protect,
  adminOnly,
};
