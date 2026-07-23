import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEdit2, FiX, FiCheck } from "react-icons/fi";
import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Tabs from "../../../components/ui/Tabs";
import Modal from "../../../components/ui/Modal";
import PageHeader from "../../../components/layout/PageHeader";
import {
  getProjectById,
  updateProject,
} from "../../../services/projectService";
import formatCurrency from "../../../utils/formatCurrency";

const tabs = ["Tasks", "Files", "Team", "Timeline"];

const DEFAULT_TASK_GROUPS = {
  Todo: [],
  "In Progress": [],
  Review: [],
  Done: [],
};

function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject]       = useState(null);
  const [activeTab, setActiveTab]   = useState("Tasks");
  const [editing, setEditing]       = useState(false);
  const [editForm, setEditForm]     = useState({});
  const [saving, setSaving]         = useState(false);

  // Task state
  const [taskGroups, setTaskGroups] = useState(DEFAULT_TASK_GROUPS);
  const [newTask, setNewTask]       = useState({ group: "Todo", text: "" });
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    getProjectById(id).then((p) => {
      setProject(p);
      setEditForm({ ...p });
      if (p.taskGroups && Object.keys(p.taskGroups).length) {
        setTaskGroups(p.taskGroups);
      }
    });
  }, [id]);

  // ── Edit project info ───────────────────────────────────────────────────────
  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const updated = await updateProject(id, {
        ...editForm,
        progress: Number(editForm.progress),
        budget:   Number(editForm.budget),
      });
      setProject(updated);
      setEditing(false);
      toast.success("Project updated");
    } catch {
      toast.error("Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditForm({ ...project });
    setEditing(false);
  };

  // ── Task helpers ────────────────────────────────────────────────────────────
  const addTask = async () => {
    if (!newTask.text.trim()) return;
    const updated = {
      ...taskGroups,
      [newTask.group]: [...(taskGroups[newTask.group] || []), newTask.text.trim()],
    };
    setTaskGroups(updated);
    setNewTask({ group: "Todo", text: "" });
    setShowTaskModal(false);
    // persist to project
    await updateProject(id, { taskGroups: updated }).catch(() => {});
  };

  const removeTask = async (group, index) => {
    const updated = {
      ...taskGroups,
      [group]: taskGroups[group].filter((_, i) => i !== index),
    };
    setTaskGroups(updated);
    await updateProject(id, { taskGroups: updated }).catch(() => {});
  };

  if (!project) return null;
  const projectFiles = Array.isArray(project.files) ? project.files : [];
  const projectTimeline = Array.isArray(project.timeline) ? project.timeline : [];

  const infoFields = [
    { label: "Client",     name: "client",    type: "text" },
    { label: "Start Date", name: "startDate", type: "date" },
    { label: "Deadline",   name: "deadline",  type: "date" },
    { label: "Budget (₹)", name: "budget",    type: "number" },
    { label: "Progress (%)", name: "progress", type: "number" },
    { label: "Status",     name: "status",    type: "select",
      options: ["Planning", "Active", "On Hold", "Completed"] },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        subtitle="Project details, tasks, files, team, and timeline."
        action={
          editing ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center gap-2 rounded-xl border border-[#E0E3EC] px-4 py-2 text-sm font-semibold text-slate-700"
              >
                <FiX /> Cancel
              </button>
              <Button onClick={saveEdit} disabled={saving}>
                <FiCheck className="mr-1" />
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <FiEdit2 className="mr-1" /> Edit Project
            </Button>
          )
        }
      />

      {/* ── Info Card ── */}
      <Card>
        {editing ? (
          <div className="grid gap-4 md:grid-cols-3">
            {infoFields.map(({ label, name, type, options }) =>
              type === "select" ? (
                <Select
                  key={name}
                  label={label}
                  name={name}
                  value={editForm[name] || ""}
                  onChange={handleEditChange}
                  options={options}
                />
              ) : (
                <Input
                  key={name}
                  label={label}
                  name={name}
                  type={type}
                  value={editForm[name] || ""}
                  onChange={handleEditChange}
                />
              )
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            {[
              ["Client",     project.client],
              ["Start Date", project.startDate
                ? new Date(project.startDate).toLocaleDateString("en-IN") : "—"],
              ["Deadline",   project.deadline
                ? new Date(project.deadline).toLocaleDateString("en-IN") : "—"],
              ["Budget",     formatCurrency(project.budget)],
              ["Progress",   `${project.progress}%`],
              ["Status",     project.status],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#E7E8F0] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {!editing && (
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Overall Progress</span>
              <span className="font-semibold">{project.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#EEF0F6]">
              <div
                className="h-2 rounded-full bg-[#5B3FD6] transition-all"
                style={{ width: `${Math.min(project.progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* ── Tabs ── */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* ── Tasks ── */}
      {activeTab === "Tasks" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setShowTaskModal(true)}>+ Add Task</Button>
          </div>
          <div className="grid gap-4 xl:grid-cols-4">
            {Object.entries(taskGroups).map(([group, tasks]) => (
              <Card key={group}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-950">{group}</h2>
                  <span className="rounded-full bg-[#EEF0F6] px-2 py-0.5 text-xs font-semibold text-slate-500">
                    {tasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {tasks.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No tasks</p>
                  )}
                  {tasks.map((task, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-[#E7E8F0] p-3"
                    >
                      <span className="text-sm font-semibold text-slate-700">
                        {task}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTask(group, i)}
                        className="ml-2 text-slate-400 hover:text-red-500"
                      >
                        <FiX className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── Files ── */}
      {activeTab === "Files" && (
        <Card>
          {projectFiles.length === 0 ? (
            <p className="text-sm text-slate-400">No files found</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {projectFiles.map((file) => {
                const fileName = typeof file === "string" ? file : file.name;
                return (
                <div
                  key={file.id || fileName}
                  className="rounded-xl border border-[#E7E8F0] p-4"
                >
                  <p className="font-semibold text-slate-950">{fileName}</p>
                  <p className="mt-1 text-sm text-slate-500">{file.type || "Shared file"}</p>
                </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── Team ── */}
      {activeTab === "Team" && (
        <Card>
          <div className="grid gap-3 md:grid-cols-3">
            {(project.team || []).map((member, index) => (
              <div
                key={member}
                className="flex items-center gap-3 rounded-xl border border-[#E7E8F0] p-4"
              >
                <Avatar name={member} />
                <div>
                  <p className="font-semibold text-slate-950">{member}</p>
                  <p className="text-sm text-slate-500">
                    {index === 0 ? "Project Lead" : "Contributor"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Timeline ── */}
      {activeTab === "Timeline" && (
        <Card>
          {projectTimeline.length === 0 ? (
            <p className="text-sm text-slate-400">No timeline events found</p>
          ) : (
            <div className="space-y-4">
              {projectTimeline.map((item) => {
                const label = typeof item === "string" ? item : item.title;
                return (
                  <div
                    key={item.id || label}
                    className="flex items-center gap-3 border-b border-[#ECEEF5] pb-3 last:border-0"
                  >
                    <Badge variant="primary">{item.type || "Milestone"}</Badge>
                    <span className="text-sm font-semibold text-slate-950">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── Add Task Modal ── */}
      {showTaskModal && (
        <Modal title="Add Task" onClose={() => setShowTaskModal(false)}>
          <div className="grid gap-4">
            <Select
              label="Column"
              value={newTask.group}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, group: e.target.value }))
              }
              options={Object.keys(taskGroups)}
            />
            <Input
              label="Task description"
              value={newTask.text}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, text: e.target.value }))
              }
              placeholder="e.g. Design homepage mockup"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="rounded-xl border border-[#E0E3EC] px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <Button onClick={addTask}>Add Task</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ProjectDetail;
