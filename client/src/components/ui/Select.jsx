function Select({
  label,
  options = [],
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
      <select
        className={[
          "w-full rounded-xl border border-[#E0E3EC] bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10",
          className,
        ].join(" ")}
        {...props}
      >
        {options.map((option) => (
          <option
            key={option.value ?? option}
            value={option.value ?? option}
          >
            {option.label ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default Select;