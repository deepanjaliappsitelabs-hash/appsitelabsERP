function Loader({
  label = "Loading...",
}) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm font-medium text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#6366F1]" />
      {label}
    </div>
  );
}

export default Loader;
