import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import CandidateProfile from "../../../components/recruitment/CandidateProfile";
import InterviewScheduler from "../../../components/recruitment/InterviewScheduler";
import PageHeader from "../../../components/layout/PageHeader";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import {
  getCandidateById,
  scheduleInterview,
  updateCandidateStage,
} from "../../../services/recruitmentService";

const stages = [
  "Applied",
  "Screening",
  "Interview",
  "Selected",
  "Offer Sent",
  "Joined",
  "Rejected",
];

function CandidateDetail() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    getCandidateById(id).then(setCandidate);
  }, [id]);

  if (!candidate) {
    return null;
  }

  const setStage = async (stage) => {
    await updateCandidateStage(candidate._id, stage);
    setCandidate({
      ...candidate,
      stage,
    });
  };

  const submitInterview = async (payload) => {
    await scheduleInterview(payload);
    toast.success("Interview scheduled");
    setShowScheduler(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Detail"
        subtitle="Review candidate profile, resume, interviews, and hiring notes."
        action={<Button onClick={() => setShowScheduler(true)}>Schedule Interview</Button>}
      />

      <CandidateProfile candidate={candidate} />

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-950">
          Status Flow
        </h2>
        <div className="flex flex-wrap gap-2">
          {stages.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setStage(stage)}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                candidate.stage === stage
                  ? "bg-[#5B3FD6] text-white"
                  : "bg-[#F1EDFF] text-[#5B3FD6]",
              ].join(" ")}
            >
              {stage}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-950">
            Resume Preview
          </h2>
          <div className="rounded-2xl border border-dashed border-[#CFC6FF] bg-[#FAFAFE] p-8 text-center">
            <p className="font-semibold text-slate-950">
              {candidate.resume}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Preview placeholder for uploaded resume.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-950">
            Interview History
          </h2>
          <div className="space-y-4">
            {["Screening call completed", "Technical interview scheduled"].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 border-b border-[#ECEEF5] pb-3 last:border-0"
              >
                <Badge variant="primary">HR</Badge>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{item}</p>
                  <p className="text-xs text-slate-500">May 2026</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-slate-950">
          HR Notes
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          {candidate.notes}
        </p>
      </Card>

      <InterviewScheduler
        open={showScheduler}
        candidate={candidate}
        onClose={() => setShowScheduler(false)}
        onSubmit={submitInterview}
      />
    </div>
  );
}

export default CandidateDetail;
