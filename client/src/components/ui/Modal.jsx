function Modal({
  title,
  children,
  footer,
  onClose,
  className = "max-w-2xl",
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className={["flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden rounded-2xl border border-[#E7E8F0] bg-white shadow-[0_24px_70px_rgba(48,37,104,0.18)]", className].join(" ")}>
        <div className="shrink-0 flex items-center justify-between border-b border-[#ECEEF5] px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-950">
            {title}
          </h2>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-xl leading-none text-slate-500 hover:bg-[#F3F0FA] hover:text-[#302568]"
            >
              ×
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-[#ECEEF5] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
