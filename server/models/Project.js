// server/models/Project.js
const pool = require("../config/db");

const parseTeam = (team) => {
  if (Array.isArray(team)) return team;
  if (!team) return [];

  try {
    const parsed = JSON.parse(team);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(team)
      .split(",")
      .map((member) => member.trim())
      .filter(Boolean);
  }
};

const mapProject = (row) => ({
  ...row,
  _id: row.id,
  startDate: row.start_date,
  team: parseTeam(row.team),
});

const projectSelect = `
  SELECT
    id,
    name,
    client,
    status,
    progress,
    DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline,
    DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
    budget,
    team,
    created_at
  FROM projects
`;

const getAllProjects = async () => {
  const [rows] = await pool.query(`
    ${projectSelect}
    ORDER BY created_at DESC
  `);
  return rows.map(mapProject);
};

const getProjectById = async (id) => {
  const [rows] = await pool.query(
    `
      ${projectSelect}
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );
  return rows[0] ? mapProject(rows[0]) : null;
};

const createProject = async ({
  name,
  client,
  status,
  progress,
  deadline,
  start_date,
  budget,
  team,
}) => {
  const [result] = await pool.query(
    `INSERT INTO projects
      (name, client, status, progress, deadline, start_date, budget, team)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      client || null,
      status || "Planning",
      Number(progress) || 0,
      deadline || null,
      start_date || null,
      Number(budget) || 0,
      JSON.stringify(parseTeam(team)),
    ]
  );
  return result.insertId;
};

const updateProject = async (
  id,
  { name, client, status, progress, deadline, start_date, budget, team }
) => {
  await pool.query(
    `UPDATE projects
     SET name = ?, client = ?, status = ?, progress = ?, deadline = ?,
         start_date = ?, budget = ?, team = ?
     WHERE id = ?`,
    [
      name,
      client || null,
      status || "Planning",
      Number(progress) || 0,
      deadline || null,
      start_date || null,
      Number(budget) || 0,
      JSON.stringify(parseTeam(team)),
      id,
    ]
  );
};

const deleteProject = async (id) => {
  await pool.query("DELETE FROM projects WHERE id = ?", [id]);
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
