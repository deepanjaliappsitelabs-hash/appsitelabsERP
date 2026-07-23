import Badge from "../ui/Badge";
import Card from "../ui/Card";

function CandidateProfile({ candidate }) {
  if (!candidate) {
    return null;
  }

  return (
    <Card>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-950">
              {candidate.name}
            </h2>
            <Badge variant="primary">
              {candidate.stage}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Applied for {candidate.appliedFor}
          </p>
        </div>
        <div className="rounded-2xl bg-[#F1EDFF] px-4 py-3 text-sm font-semibold text-[#5B3FD6]">
          {candidate.resume || "Resume attached"}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["Email", candidate.email],
          ["Phone", candidate.phone],
          ["Date Applied", candidate.dateApplied],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[#E7E8F0] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-[#E7E8F0] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          HR Notes
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {candidate.notes || "No notes added yet."}
        </p>
      </div>
    </Card>
  );
}

export default CandidateProfile;
