// server/routes/projectRoutes.js
const express    = require("express");
const router     = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getProjects, getProjectById, createProject, updateProject, deleteProject,
  getContacts, createContact, updateContact, deleteContact,
} = require("../controllers/projectController");

// Projects
router.get("/",        protect, getProjects);
router.get("/:id",     protect, getProjectById);
router.post("/",       protect, createProject);
router.put("/:id",     protect, updateProject);
router.delete("/:id",  protect, deleteProject);

module.exports = router;
