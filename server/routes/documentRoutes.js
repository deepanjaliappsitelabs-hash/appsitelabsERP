// server/routes/documentRoutes.js
const express    = require("express");
const router     = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getDocuments, uploadDocument, deleteDocument } = require("../controllers/documentController");

router.get("/",       protect, getDocuments);
router.post("/",      protect, uploadDocument);
router.delete("/:id", protect, deleteDocument);

module.exports = router;