import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import Badge from "../../../components/ui/Badge";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Table from "../../../components/ui/Table";
import PageHeader from "../../../components/layout/PageHeader";
import {
  deleteCandidate,
  getCandidates,
  getJobs,
} from "../../../services/recruitmentService";

const stageVariant = {
  Applied:    "neutral",
  Screening:  "warning",
  Interview:  "primary",
  Selected:   "success",
  "Offer Sent": "success",
  Joined:     "success",
  Rejected:   "danger",
};

function CandidateList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    job: searchParams.get("job") || "",   // pre-fill from Jobs "View" button
    stage: "",
  });

  useEffect(() => {
    Promise.all([getCandidates(), getJobs()]).then(
      ([candidateData, jobData]) => {
        setCandidates(candidateData);
        setJobs(jobData);
      }
    );
  }, []);

  const filteredCandidates = useMemo(
    () =>
      candidates.filter((c) => {
        const query = filters.search.toLowerCase();
        const matchesSearch =
          !query ||
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query);
        const matchesJob = !filters.job || c.appliedFor === filters.job;
        const matchesStage = !filters.stage || c.stage === filters.stage;
        return matchesSearch && matchesJob && matchesStage;
      }),
    [candidates, filters]
  );

  const handleChange = (e) =>
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleDelete = async (candidate) => {
    if (!window.confirm(`Delete candidate "${candidate.name}"?`)) return;

    try {
      await deleteCandidate(candidate._id);
      setCandidates((current) =>
        current.filter((item) => item._id !== candidate._id)
      );
      toast.success("Candidate deleted");
    } catch (err) {
      toast.error("Delete failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidates"
        subtitle="Search applicants by job, stage, and contact details."
      />

      {/* Filters */}
      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            label="Search name or email"
            name="search"
            value={filters.search}
            onChange={handleChange}
          />
          <Select
            label="Job"
            name="job"
            value={filters.job}
            onChange={handleChange}
            options={[
              { value: "", label: "All jobs" },
              ...jobs.map((j) => ({ value: j.title, label: j.title })),
            ]}
          />
          <Select
            label="Stage"
            name="stage"
            value={filters.stage}
            onChange={handleChange}
            options={[
              { value: "", label: "All stages" },
              { value: "Applied",    label: "Applied" },
              { value: "Screening",  label: "Screening" },
              { value: "Interview",  label: "Interview" },
              { value: "Selected",   label: "Selected" },
              { value: "Offer Sent", label: "Offer Sent" },
              { value: "Joined",     label: "Joined" },
              { value: "Rejected",   label: "Rejected" },
            ]}
          />
        </div>

        {filteredCandidates.length > 0 && (
          <p className="mt-3 text-sm text-slate-500">
            Showing <strong>{filteredCandidates.length}</strong> candidate
            {filteredCandidates.length !== 1 ? "s" : ""}
            {filters.job ? ` for "${filters.job}"` : ""}
          </p>
        )}
      </Card>

      {/* Table */}
      <Table
        columns={[
          "Candidate",
          "Email",
          "Phone",
          "Applied For",
          "Stage",
          "Date Applied",
          "Actions",
        ]}
        data={filteredCandidates}
        renderRow={(candidate) => (
          <tr
            key={candidate._id}
            className="cursor-pointer hover:bg-[#FAFAFE] transition"
            onClick={() =>
              navigate(`/admin/recruitment/candidates/${candidate._id}`)
            }
          >
            {/* Name + initials avatar */}
            <td className="px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1EDFF] text-xs font-bold text-[#5B3FD6]">
                  {candidate.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{candidate.name}</p>
                  {candidate.resume && (
                    <p className="text-xs text-slate-400">{candidate.resume}</p>
                  )}
                </div>
              </div>
            </td>
            <td className="px-4 py-4 text-sm">{candidate.email}</td>
            <td className="px-4 py-4 text-sm">{candidate.phone}</td>
            <td className="px-4 py-4 text-sm">{candidate.appliedFor}</td>
            <td className="px-4 py-4">
              <Badge variant={stageVariant[candidate.stage] || "neutral"}>
                {candidate.stage}
              </Badge>
            </td>
            <td className="px-4 py-4 text-sm text-slate-500">
              {candidate.dateApplied}
            </td>
            {/* Explicit actions — row is also clickable */}
            <td
              className="px-4 py-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/admin/recruitment/candidates/${candidate._id}`)
                  }
                  className="rounded-lg bg-[#F1EDFF] px-3 py-1.5 text-xs font-semibold text-[#5B3FD6] transition hover:bg-[#E4DCFF]"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(candidate)}
                  className="rounded-lg bg-[#FEF3F2] px-3 py-1.5 text-xs font-semibold text-[#B42318] transition hover:bg-[#FEE4E2]"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );
}

export default CandidateList;
