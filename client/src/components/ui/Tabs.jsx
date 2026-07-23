function Tabs({
  tabs = [],
  activeTab,
  onChange,
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E7E8F0] bg-white p-2">
      {tabs.map((tab) => {
        const id = tab.id ?? tab;
        const label = tab.label ?? tab;
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={[
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              isActive
                ? "bg-[#302568] text-white"
                : "text-slate-600 hover:bg-[#EDE8F5] hover:text-[#302568]",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;