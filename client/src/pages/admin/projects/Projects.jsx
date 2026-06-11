import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEye, FiPlus } from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import Table from "../../../components/ui/Table";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from "../../../services/projectService";
import formatCurrency from "../../../utils/formatCurrency";

const emptyProject = {
  name: "",
  client: "",
  status: "Planning",
  progress: 0,
  startDate: "",
  deadline: "",
  budget: 0,
  team: "",
};

const statusVariant = {
  Active: "success",
  Planning: "warning",
  "On Hold": "neutral",
  Completed: "primary",
};

function normalizeProject(project) {
  return {
    ...project,
    startDate: project.startDate || project.start_date || "",
    team: Array.isArray(project.team)
      ? project.team
      : String(project.team || "")
          .split(",")
          .map((member) => member.trim())
          .filter(Boolean),
  };
}

function Projects() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyProject);

  useEffect(() => {
    getProjects()
      .then((items) => setProjects(items.map(normalizeProject)))
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load projects from database");
      });
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyProject);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData(emptyProject);
    setShowModal(true);
  };

  const openEdit = (project) => {
    setEditingId(project._id);
    setFormData({
      ...emptyProject,
      ...normalizeProject(project),
      team: normalizeProject(project).team.join(", "),
    });
    setShowModal(true);
  };

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...formData,
      progress: Number(formData.progress) || 0,
      budget: Number(formData.budget) || 0,
      team: formData.team
        .split(",")
        .map((member) => member.trim())
        .filter(Boolean),
    };

    try {
      if (editingId) {
        const updated = normalizeProject(await updateProject(editingId, payload));
        setProjects((current) =>
          current.map((project) =>
            project._id === editingId ? updated : project
          )
        );
        toast.success("Project updated");
      } else {
        const created = normalizeProject(await createProject(payload));
        setProjects((current) => [created, ...current]);
        toast.success("Project added");
      }

      closeModal();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save project in database");
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete project "${project.name}"?`)) return;

    try {
      await deleteProject(project._id);
      setProjects((current) => current.filter((item) => item._id !== project._id));
      toast.success("Project deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete project");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="Track project status, budgets, deadlines, and delivery teams."
        action={
          <Button onClick={openAdd}>
            <FiPlus /> Add Project
          </Button>
        }
      />

      <Table
        columns={[
          "Project",
          "Client",
          "Status",
          "Progress",
          "Deadline",
          "Budget",
          "Team",
          "Actions",
        ]}
        data={projects}
        renderRow={(project) => (
          <tr key={project._id}>
            <td className="px-4 py-4 font-semibold text-slate-950">
              {project.name}
            </td>
            <td className="px-4 py-4">{project.client || "-"}</td>
            <td className="px-4 py-4">
              <Badge variant={statusVariant[project.status] || "neutral"}>
                {project.status || "Planning"}
              </Badge>
            </td>
            <td className="px-4 py-4">
              <div className="w-28">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>{Number(project.progress) || 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#EEF0F6]">
                  <div
                    className="h-2 rounded-full bg-[#5B3FD6]"
                    style={{
                      width: `${Math.min(Number(project.progress) || 0, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </td>
            <td className="px-4 py-4">
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString("en-IN")
                : "-"}
            </td>
            <td className="px-4 py-4">{formatCurrency(project.budget)}</td>
            <td className="px-4 py-4">
              {project.team?.length ? project.team.join(", ") : "-"}
            </td>
            <td className="px-4 py-4">
              <div className="flex gap-2">
                <Link
                  to={`/admin/projects/${project._id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#F1EDFF] px-3 py-2 text-sm font-semibold text-[#5B3FD6]"
                >
                  <FiEye /> View
                </Link>
                <button
                  type="button"
                  onClick={() => openEdit(project)}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(project)}
                  className="rounded-lg bg-[#FEF3F2] px-3 py-2 text-sm font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {showModal && (
        <Modal title={editingId ? "Edit Project" : "Add Project"} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <Input
              label="Project Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              label="Client"
              name="client"
              value={formData.client}
              onChange={handleChange}
            />
            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={["Planning", "Active", "On Hold", "Completed"]}
            />
            <Input
              label="Progress (%)"
              name="progress"
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={handleChange}
            />
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
            />
            <Input
              label="Deadline"
              name="deadline"
              type="date"
              value={formData.deadline}
              onChange={handleChange}
            />
            <Input
              label="Budget"
              name="budget"
              type="number"
              value={formData.budget}
              onChange={handleChange}
            />
            <Input
              label="Team"
              name="team"
              value={formData.team}
              onChange={handleChange}
              placeholder="Aarav, Nisha, Kabir"
            />
            <div className="flex justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-[#E0E3EC] px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <Button type="submit">
                {editingId ? "Update Project" : "Save Project"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Projects;
