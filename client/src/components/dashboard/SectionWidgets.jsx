import { FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

function SectionWidgets({ sections = [] }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      {sections.map((section) => (
        <div
          key={section.title}
          className="rounded-2xl border border-[#E7E8F0] bg-white p-5 shadow-[0_14px_40px_rgba(17,24,39,0.05)] transition hover:border-[#CFC6FF]"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1EDFF] text-[#5B3FD6]">
                {section.icon}
              </div>
              <h2 className="text-sm font-semibold text-slate-950">
                {section.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate(section.to)}
              className="flex items-center gap-1 text-xs font-semibold text-[#5B3FD6]"
            >
              View All
              <FiArrowRight />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t border-[#ECEEF5] pt-4">
            {section.stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-lg font-bold text-slate-950">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SectionWidgets;
