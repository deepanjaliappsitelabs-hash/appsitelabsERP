import Badge from "../ui/Badge";

function CandidateCard({
  candidate,
  onOpen,
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(candidate)}
      className="w-full rounded-xl border border-[#E7E8F0] bg-white p-4 text-left transition hover:border-[#CFC6FF] hover:bg-[#FAFAFE]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">
            {candidate.name}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {candidate.appliedFor}
          </p>
        </div>
        <Badge variant="primary">
          {candidate.stage}
        </Badge>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Applied {candidate.dateApplied}
      </p>
    </button>
  );
}

export default CandidateCard;
