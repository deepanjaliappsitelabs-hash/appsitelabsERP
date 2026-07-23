// server/controllers/documentController.js
const Document = require("../models/Document");

const getDocuments = async (req, res) => {
  try {
    const docs = await Document.getAllDocuments();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadDocument = async (req, res) => {
  try {
    const { name, folder, size, uploadedBy, fileData, mimeType } = req.body;
    const id = await Document.createDocument({
      name, folder, size,
      uploaded_by: uploadedBy,
      file_data:   fileData,
      mime_type:   mimeType,
    });
    const document = await Document.getDocumentById(id);
    res.status(201).json(document);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    await Document.deleteDocument(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDocuments, uploadDocument, deleteDocument };
