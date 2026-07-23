const express = require("express");

const {
  signupUser,
  loginUser,
} = require("../controllers/authController");
const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginUser);
router.post(
  "/signup",
  protect,
  adminOnly,
  signupUser
);

module.exports = router;
