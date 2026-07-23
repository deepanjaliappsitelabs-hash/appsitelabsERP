// server/models/Document.js
const pool = require("../config/db");

const mapDocument = (row) => ({
  ...row,
  _id: row.id,
  uploadedBy: row.uploaded_by,
  fileData: row.file_data,
  mimeType: row.mime_type,
});

const documentSelect = `
  SELECT
    id,
    name,
    folder,
    size,
    uploaded_by,
    file_data,
    mime_type,
    DATE_FORMAT(date, '%Y-%m-%d') AS date,
    created_at
  FROM documents
`;

const getAllDocuments = async () => {
  const [rows] = await pool.query(`
    ${documentSelect}
    ORDER BY created_at DESC
  `);
  return rows.map(mapDocument);
};

const getDocumentById = async (id) => {
  const [rows] = await pool.query(
    `
      ${documentSelect}
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );
  return rows[0] ? mapDocument(rows[0]) : null;
};

const createDocument = async ({
  name,
  folder,
  size,
  uploaded_by,
  file_data,
  mime_type,
}) => {
  const [result] = await pool.query(
    `INSERT INTO documents
      (name, folder, size, uploaded_by, file_data, mime_type, date)
     VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
    [
      name,
      folder || "General",
      size || "0 KB",
      uploaded_by || "Admin",
      file_data || null,
      mime_type || null,
    ]
  );
  return result.insertId;
};

const deleteDocument = async (id) => {
  await pool.query("DELETE FROM documents WHERE id = ?", [id]);
};

module.exports = {
  getAllDocuments,
  getDocumentById,
  createDocument,
  deleteDocument,
};
