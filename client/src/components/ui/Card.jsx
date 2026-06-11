function Card({
  children,
  className = "",
}) {
  return (
    <div
      className={`rounded-2xl border border-[#E7E8F0] bg-white p-6 shadow-[0_14px_40px_rgba(48,37,104,0.07)] ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;