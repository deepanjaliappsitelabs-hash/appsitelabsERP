import { useNavigate } from "react-router-dom";

function StatsCard({ title, value, icon, to, onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    if (to) {
      navigate(to);
    }
  };

  const content = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</h2>
      </div>
      <div className="rounded-xl bg-[#EDE8F5] p-3 text-2xl text-[#302568]">
        {icon}
      </div>
    </div>
  );

  if (to || onClick) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="w-full rounded-2xl border border-[#E7E8F0] bg-white p-5 shadow-[0_14px_40px_rgba(48,37,104,0.07)] text-left transition hover:border-[#7560A7] hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E7E8F0] bg-white p-5 shadow-[0_14px_40px_rgba(48,37,104,0.07)]">
      {content}
    </div>
  );
}

export default StatsCard;
