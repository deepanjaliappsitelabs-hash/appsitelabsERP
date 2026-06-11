function Input({
  label,
  error,
  className = "",
  ...props
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </span>
      )}

      <input
        className={[
          "w-full rounded-xl border border-[#E0E3EC] bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10",
          error
            ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20"
            : "",
          className,
        ].join(" ")}
        {...props}
      />

      {error && (
        <span className="mt-1.5 block text-sm text-[#EF4444]">
          {error}
        </span>
      )}
    </label>
  );
}

export default Input;