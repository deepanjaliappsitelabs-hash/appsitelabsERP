// server/controllers/projectController.js
const Project = require("../models/Project");
const Contact = require("../models/Contact");

// ── Projects ──────────────────────────────────────────────────────────────────
const getProjects = async (req, res) => {
  try {
    const projects = await Project.getAllProjects();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, client, status, progress, deadline, startDate, budget, team } = req.body;
    const id = await Project.createProject({
      name, client, status, progress,
      deadline,
      start_date: startDate,
      budget, team,
    });
    const project = await Project.getProjectById(id);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { name, client, status, progress, deadline, startDate, budget, team } = req.body;
    await Project.updateProject(req.params.id, {
      name, client, status, progress,
      deadline,
      start_date: startDate,
      budget, team,
    });
    const project = await Project.getProjectById(req.params.id);
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    await Project.deleteProject(req.params.id);
    res.json({ success: true, message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Contacts ──────────────────────────────────────────────────────────────────
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.getAllContacts();
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createContact = async (req, res) => {
  try {
    const id = await Contact.createContact(req.body);
    res.status(201).json({ ...req.body, id, _id: id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateContact = async (req, res) => {
  try {
    await Contact.updateContact(req.params.id, req.body);
    const contact = await Contact.getContactById(req.params.id);
    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteContact = async (req, res) => {
  try {
    await Contact.deleteContact(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getProjects, getProjectById, createProject, updateProject, deleteProject,
  getContacts, createContact, updateContact, deleteContact,
};
