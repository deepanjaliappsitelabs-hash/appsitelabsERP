import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import Table from "../../../components/ui/Table";
import PageHeader from "../../../components/layout/PageHeader";
import {
  createJob,
  deleteJob,
  getJobs,
  updateJobStatus,
} from "../../../services/recruitmentService";

const emptyJob = {
  title: "",
  department: "",
  type: "Full-time",
  openings: 1,
  status: "Active",
  description: "",
  requirements: "",
  salaryRange: "",
  location: "",
  lastDate: "",
};

const jobTypes = ["Full-time", "Part-time", "Intern", "Contract"];
const jobStatuses = ["Active", "Paused", "Closed"];

// ── Job Form (shared by Add and Edit) ────────────────────────────────────────
function JobForm({ formData, onChange, onSubmit, onClose, title }) {
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <Input
          label="Job Title"
          name="title"
          value={formData.title}
          onChange={onChange}
          required
        />
        <Input
          label="Department"
          name="department"
          value={formData.department}
          onChange={onChange}
        />
        <Select
          label="Type"
          name="type"
          value={formData.type}
          onChange={onChange}
          options={jobTypes.map((t) => ({ value: t, label: t }))}
        />
        <Input
          label="Openings"
          name="openings"
          type="number"
          min={1}
          value={formData.openings}
          onChange={onChange}
        />
        <Input
          label="Salary Range"
          name="salaryRange"
          value={formData.salaryRange}
          onChange={onChange}
          placeholder="e.g. 8 LPA - 12 LPA"
        />
        <Input
          label="Location"
          name="location"
          value={formData.location}
          onChange={onChange}
        />
        <Input
          label="Last Date to Apply"
          name="lastDate"
          type="date"
          value={formData.lastDate}
          onChange={onChange}
        />
        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={onChange}
          options={jobStatuses.map((s) => ({ value: s, label: s }))}
        />
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Requirements
          </span>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={onChange}
            rows="2"
            placeholder="Key skills, qualifications…"
            className="w-full rounded-xl border border-[#E0E3EC] p-3 text-sm outline-none focus:border-[#5B3FD6] focus:ring-4 focus:ring-[#5B3FD6]/10"
          />
        </label>
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Description
          </span>
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            rows="3"
            className="w-full rounded-xl border border-[#E0E3EC] p-3 text-sm outline-none focus:border-[#5B3FD6] focus:ring-4 focus:ring-[#5B3FD6]/10"
          />
        </label>
        <div className="flex justify-end gap-3 md:col-span-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E0E3EC] px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F9FC]"
          >
            Cancel
          </button>
          <Button type="submit">Save Job</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [formData, setFormData] = useState(emptyJob);

  useEffect(() => {
    getJobs().then(setJobs);
  }, []);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEditChange = (e) =>
    setEditJob((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // Add new job
  const handleSubmit = async (e) => {
    e.preventDefault();
    const created = await createJob(formData);
    setJobs((prev) => [created, ...prev]);
    toast.success("Job posted successfully");
    setShowAdd(false);
    setFormData(emptyJob);
  };

  // Save edited job
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    // optimistic update (replace with real API call if backend exists)
    setJobs((prev) =>
      prev.map((j) => (j._id === editJob._id ? editJob : j))
    );
    toast.success("Job updated");
    setEditJob(null);
  };

  // Toggle Active / Paused
  const toggleStatus = async (job) => {
    const nextStatus = job.status === "Active" ? "Paused" : "Active";
    await updateJobStatus(job._id, nextStatus);
    setJobs((prev) =>
      prev.map((j) => (j._id === job._id ? { ...j, status: nextStatus } : j))
    );
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete job "${job.title}"?`)) return;

    try {
      await deleteJob(job._id);
      setJobs((prev) => prev.filter((item) => item._id !== job._id));
      toast.success("Job deleted");
    } catch (err) {
      toast.error("Delete failed: " + err.message);
    }
  };

  const statusVariant = { Active: "success", Paused: "warning", Closed: "danger" };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        subtitle="Publish openings and monitor application volume."
        action={<Button onClick={() => setShowAdd(true)}>Add Job</Button>}
      />

      <Table
        columns={[
          "Title",
          "Department",
          "Type",
          "Location",
          "Openings",
          "Applications",
          "Status",
          "Posted",
          "Actions",
        ]}
        data={jobs}
        renderRow={(job) => (
          <tr key={job._id}>
            <td className="px-4 py-4">
              <p className="font-semibold text-slate-950">{job.title}</p>
              {job.salaryRange && (
                <p className="text-xs text-slate-500">{job.salaryRange}</p>
              )}
            </td>
            <td className="px-4 py-4 text-sm">{job.department}</td>
            <td className="px-4 py-4 text-sm">{job.type}</td>
            <td className="px-4 py-4 text-sm">{job.location || "-"}</td>
            <td className="px-4 py-4 text-center text-sm">{job.openings}</td>
            <td className="px-4 py-4 text-center text-sm">{job.applications ?? 0}</td>
            <td className="px-4 py-4">
              <Badge variant={statusVariant[job.status] || "neutral"}>
                {job.status}
              </Badge>
            </td>
            <td className="px-4 py-4 text-sm text-slate-500">{job.postedDate}</td>
            <td className="px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {/* View candidates for this job */}
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/admin/recruitment/candidates?job=${encodeURIComponent(job.title)}`
                    )
                  }
                  className="rounded-lg bg-[#ECFDF3] px-3 py-1.5 text-xs font-semibold text-[#027A48] transition hover:bg-[#D1FADF]"
                >
                  View
                </button>
                {/* Edit */}
                <button
                  type="button"
                  onClick={() => setEditJob({ ...job })}
                  className="rounded-lg bg-[#F1EDFF] px-3 py-1.5 text-xs font-semibold text-[#5B3FD6] transition hover:bg-[#E4DCFF]"
                >
                  Edit
                </button>
                {/* Toggle Active/Paused */}
                <button
                  type="button"
                  onClick={() => toggleStatus(job)}
                  className="rounded-lg bg-[#F6F7FB] px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-[#ECEEF5]"
                >
                  {job.status === "Active" ? "Pause" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(job)}
                  className="rounded-lg bg-[#FEF3F2] px-3 py-1.5 text-xs font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Add Job modal */}
      {showAdd && (
        <JobForm
          title="Add Job"
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Edit Job modal */}
      {editJob && (
        <JobForm
          title="Edit Job"
          formData={editJob}
          onChange={handleEditChange}
          onSubmit={handleEditSubmit}
          onClose={() => setEditJob(null)}
        />
      )}
    </div>
  );
}

export default Jobs;
