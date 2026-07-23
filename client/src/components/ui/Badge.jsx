const variants = {
  success:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  danger:
    "bg-red-50 text-red-700 ring-red-600/20",
  warning:
    "bg-amber-50 text-amber-700 ring-amber-600/20",
  neutral:
    "bg-slate-100 text-slate-700 ring-slate-600/20",
  primary:
    "bg-[#EDE8F5] text-[#302568] ring-[#7560A7]/25",
};

function Badge({
  children,
  variant = "neutral",
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        variants[variant] || variants.neutral,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export default Badge;