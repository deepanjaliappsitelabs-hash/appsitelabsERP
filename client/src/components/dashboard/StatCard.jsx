function StatCard({
  title,
  value,
}) {
  return (
    <div className="rounded-2xl border border-[#E7E8F0] bg-white p-5 shadow-[0_14px_40px_rgba(17,24,39,0.05)]">
      <h2 className="text-sm font-medium text-slate-500">
        {title}
      </h2>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </h1>
    </div>
  );
}

export default StatCard;
