// ─────────────────────────────────────────────────────────────────────────────
// Task pages: TaskList, TaskKanban
// Save as: client/src/pages/admin/apps/Tasks.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Modal from "../../../components/ui/Modal";

const PRIORITIES = ["Low", "Medium", "High"];
const STATUSES   = ["Todo", "In Progress", "Review", "Done"];

const PRIORITY_COLOR = {
  Low:    "success",
  Medium: "warning",
  High:   "danger",
};

const defaultTasks = [
  { id: 1, title: "Design new dashboard layout",  status: "Done",        priority: "High",   assignee: "Nisha",  due: "2026-05-10" },
  { id: 2, title: "Integrate payroll API",         status: "In Progress", priority: "High",   assignee: "Kabir",  due: "2026-05-18" },
  { id: 3, title: "Write HR policy document",      status: "Todo",        priority: "Medium", assignee: "Aarav",  due: "2026-05-22" },
  { id: 4, title: "QA attendance module",          status: "Review",      priority: "Medium", assignee: "Meera",  due: "2026-05-14" },
  { id: 5, title: "Fix export date bug",           status: "In Progress", priority: "High",   assignee: "Dev",    due: "2026-05-13" },
  { id: 6, title: "Update onboarding checklist",   status: "Todo",        priority: "Low",    assignee: "Sara",   due: "2026-05-28" },
  { id: 7, title: "Setup email notifications",     status: "Todo",        priority: "Medium", assignee: "Aarav",  due: "2026-05-30" },
  { id: 8, title: "Performance review prep",       status: "Done",        priority: "Low",    assignee: "Nisha",  due: "2026-05-05" },
];

const emptyTask = { title: "", status: "Todo", priority: "Medium", assignee: "", due: "" };

// ── TaskList ──────────────────────────────────────────────────────────────────
export function TaskList() {
  const navigate    = useNavigate();
  const [tasks,    setTasks]     = useState(defaultTasks);
  const [filter,   setFilter]    = useState("All");
  const [showModal,setShowModal] = useState(false);
  const [editingId,setEditingId] = useState(null);
  const [formData, setFormData]  = useState(emptyTask);

  const filtered = filter === "All" ? tasks : tasks.filter(t => t.status === filter);

  const openAdd = () => {
    setEditingId(null);
    setFormData(emptyTask);
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingId(task.id);
    setFormData({ ...task });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;
    if (editingId) {
      setTasks(prev => prev.map(t => t.id === editingId ? { ...t, ...formData } : t));
    } else {
      setTasks(prev => [...prev, { ...formData, id: Date.now() }]);
    }
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyTask);
  };

  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        subtitle="Manage and track team tasks."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/admin/tasks/kanban")}
              className="rounded-xl border border-[#E0E3EC] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[#F1EDFF]"
            >
              📋 Kanban View
            </button>
            <Button onClick={openAdd}>+ Add Task</Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {STATUSES.map(s => (
          <Card key={s}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{counts[s]}</p>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["All", ...STATUSES].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              filter === s
                ? "bg-[#5B3FD6] text-white"
                : "border border-[#E0E3EC] text-slate-700 hover:bg-[#F1EDFF]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E7E8F0]">
                {["Task", "Assignee", "Priority", "Status", "Due Date", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F2F7]">
              {filtered.map(task => (
                <tr key={task.id} className="hover:bg-[#FAFAFF]">
                  <td className="px-4 py-3 font-semibold text-slate-900">{task.title}</td>
                  <td className="px-4 py-3 text-slate-600">{task.assignee || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={PRIORITY_COLOR[task.priority]}>{task.priority}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={task.status === "Done" ? "success" : "primary"}>{task.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{task.due || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(task)} className="rounded-lg bg-[#F1EDFF] p-2 text-[#5B3FD6]"><FiEdit2 /></button>
                      <button type="button" onClick={() => deleteTask(task.id)} className="rounded-lg bg-[#FEF3F2] p-2 text-[#B42318]"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">No tasks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <Modal
          title={editingId ? "Edit Task" : "Add Task"}
          onClose={() => { setShowModal(false); setEditingId(null); setFormData(emptyTask); }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input label="Task Title" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <Input label="Assignee" value={formData.assignee} onChange={e => setFormData(p => ({ ...p, assignee: e.target.value }))} />
            <Input label="Due Date" type="date" value={formData.due} onChange={e => setFormData(p => ({ ...p, due: e.target.value }))} />
            <Select label="Priority" value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} options={PRIORITIES} />
            <Select label="Status"   value={formData.status}   onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}   options={STATUSES} />
            <div className="flex justify-end gap-3 md:col-span-2">
              <button type="button" onClick={() => { setShowModal(false); setFormData(emptyTask); }} className="rounded-xl border border-[#E0E3EC] px-5 py-3 text-sm font-semibold text-slate-700">Cancel</button>
              <Button onClick={handleSave}>{editingId ? "Update" : "Save Task"}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── TaskKanban ────────────────────────────────────────────────────────────────
export function TaskKanban() {
  const navigate = useNavigate();
  const [tasks, setTasks]        = useState(defaultTasks);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData]   = useState(emptyTask);
  const [dragId, setDragId]       = useState(null);

  const handleDrop = (status) => {
    if (!dragId) return;
    setTasks(prev => prev.map(t => t.id === dragId ? { ...t, status } : t));
    setDragId(null);
  };

  const addTask = () => {
    if (!formData.title.trim()) return;
    setTasks(prev => [...prev, { ...formData, id: Date.now() }]);
    setShowModal(false);
    setFormData(emptyTask);
  };

  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kanban Board"
        subtitle="Drag tasks between columns to update status."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/admin/tasks")}
              className="rounded-xl border border-[#E0E3EC] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[#F1EDFF]"
            >
              📋 List View
            </button>
            <Button onClick={() => { setFormData(emptyTask); setShowModal(true); }}>+ Add Task</Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATUSES.map(status => {
          const col = tasks.filter(t => t.status === status);
          return (
            <div
              key={status}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(status)}
              className="rounded-2xl border border-[#E7E8F0] bg-[#FAFAFF] p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{status}</h3>
                <span className="rounded-full bg-white border border-[#E7E8F0] px-2 py-0.5 text-xs font-bold text-slate-500">
                  {col.length}
                </span>
              </div>
              <div className="space-y-3 min-h-[120px]">
                {col.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragId(task.id)}
                    className="cursor-grab rounded-xl border border-[#E7E8F0] bg-white p-3 shadow-sm active:cursor-grabbing"
                  >
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge variant={PRIORITY_COLOR[task.priority]}>{task.priority}</Badge>
                      <button type="button" onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-400">
                        <FiX className="text-xs" />
                      </button>
                    </div>
                    {task.assignee && (
                      <p className="mt-2 text-xs text-slate-400">👤 {task.assignee}</p>
                    )}
                    {task.due && (
                      <p className="mt-1 text-xs text-slate-400">📅 {task.due}</p>
                    )}
                  </div>
                ))}
                {col.length === 0 && (
                  <p className="text-center text-xs text-slate-300 italic pt-4">Drop tasks here</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Add Task" onClose={() => { setShowModal(false); setFormData(emptyTask); }}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input label="Task Title" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
            </div>
            <Input label="Assignee" value={formData.assignee} onChange={e => setFormData(p => ({ ...p, assignee: e.target.value }))} />
            <Input label="Due Date" type="date" value={formData.due} onChange={e => setFormData(p => ({ ...p, due: e.target.value }))} />
            <Select label="Priority" value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} options={PRIORITIES} />
            <Select label="Column"   value={formData.status}   onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}   options={STATUSES} />
            <div className="flex justify-end gap-3 md:col-span-2">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-[#E0E3EC] px-5 py-3 text-sm font-semibold text-slate-700">Cancel</button>
              <Button onClick={addTask}>Save Task</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}