// server/models/Contact.js
const pool = require("../config/db");

const mapContact = (row) => ({
  ...row,
  _id: row.id,
});

const getAllContacts = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM contacts ORDER BY created_at DESC"
  );
  return rows.map(mapContact);
};

const getContactById = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM contacts WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] ? mapContact(rows[0]) : null;
};

const createContact = async ({ name, company, email, phone, type }) => {
  const [result] = await pool.query(
    `INSERT INTO contacts (name, company, email, phone, type)
     VALUES (?, ?, ?, ?, ?)`,
    [
      name,
      company || null,
      email || null,
      phone || null,
      type || "Client",
    ]
  );
  return result.insertId;
};

const updateContact = async (id, { name, company, email, phone, type }) => {
  await pool.query(
    `UPDATE contacts
     SET name = ?, company = ?, email = ?, phone = ?, type = ?
     WHERE id = ?`,
    [
      name,
      company || null,
      email || null,
      phone || null,
      type || "Client",
      id,
    ]
  );
};

const deleteContact = async (id) => {
  await pool.query("DELETE FROM contacts WHERE id = ?", [id]);
};

module.exports = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
};
