import CandidateCard from "./CandidateCard";

const stages = [
  "Applied",
  "Screening",
  "Interview",
  "Selected",
  "Offer Sent",
  "Joined",
];

function PipelineBoard({
  candidates = [],
  onOpenCandidate,
}) {
  return (
    <div className="grid gap-4 overflow-x-auto xl:grid-cols-6">
      {stages.map((stage) => {
        const items = candidates.filter(
          (candidate) => candidate.stage === stage
        );

        return (
          <div
            key={stage}
            className="min-w-56 rounded-2xl border border-[#E7E8F0] bg-[#FAFAFD] p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-950">
                {stage}
              </h2>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-[#5B3FD6]">
                {items.length}
              </span>
            </div>
            <div className="space-y-3">
              {items.map((candidate) => (
                <CandidateCard
                  key={candidate._id}
                  candidate={candidate}
                  onOpen={onOpenCandidate}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PipelineBoard;
