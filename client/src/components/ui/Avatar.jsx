function Avatar({
  name = "User",
  src,
  className = "",
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={[
        "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F1EDFF] text-sm font-bold text-[#5B3FD6]",
        className,
      ].join(" ")}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        initials || "U"
      )}
    </div>
  );
}

export default Avatar;
