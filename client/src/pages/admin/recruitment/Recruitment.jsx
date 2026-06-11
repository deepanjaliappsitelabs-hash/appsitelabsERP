import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiFilter, FiUsers, FiXCircle } from "react-icons/fi";
import PipelineBoard from "../../../components/recruitment/PipelineBoard";
import PageHeader from "../../../components/layout/PageHeader";
import StatsCard from "../../../components/ui/StatsCard";
import { getCandidates } from "../../../services/recruitmentService";

function Recruitment() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    getCandidates().then(setCandidates);
  }, []);

  const countStage = (stage) =>
    candidates.filter((candidate) => candidate.stage === stage).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment"
        subtitle="Track applications through screening, interviews, offers, and joining."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Applications" value={candidates.length} icon={<FiUsers />} />
        <StatsCard title="In Screening" value={countStage("Screening")} icon={<FiFilter />} />
        <StatsCard title="Selected" value={countStage("Selected")} icon={<FiCheckCircle />} />
        <StatsCard title="Rejected This Month" value="3" icon={<FiXCircle />} />
      </div>

      <PipelineBoard
        candidates={candidates}
        onOpenCandidate={(candidate) =>
          navigate(`/admin/recruitment/candidates/${candidate._id}`)
        }
      />
    </div>
  );
}

export default Recruitment;
