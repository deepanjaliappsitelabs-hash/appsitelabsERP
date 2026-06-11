const variants = {
  primary:
    "bg-[#302568] text-white hover:bg-[#3d3080] active:bg-[#251d52] shadow-[0_1px_3px_rgba(48,37,104,0.35)]",
  secondary:
    "bg-[#EDE8F5] text-[#302568] hover:bg-[#E0D9F0] active:bg-[#d3c9ea]",
  outline:
    "border border-[#7560A7] text-[#302568] bg-white hover:bg-[#F3F0FA] active:bg-[#EDE8F5]",
  ghost:
    "text-[#302568] hover:bg-[#EDE8F5] active:bg-[#E0D9F0]",
  danger:
    "bg-[#EF4444] text-white hover:bg-[#dc2626] active:bg-[#b91c1c] shadow-[0_1px_3px_rgba(239,68,68,0.35)]",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-5 py-3 text-base rounded-xl",
};

function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  ...props
}) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7560A7] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className,
      ].join(" ")}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;