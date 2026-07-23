// server/routes/contactRoutes.js
const express    = require("express");
const router     = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getContacts, createContact, updateContact, deleteContact,
} = require("../controllers/projectController");

router.get("/",        protect, getContacts);
router.post("/",       protect, createContact);
router.put("/:id",     protect, updateContact);
router.delete("/:id",  protect, deleteContact);

module.exports = router;