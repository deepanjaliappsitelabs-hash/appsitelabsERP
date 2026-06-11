function EmployeePagination({
  page,
  totalPages,
  totalItems,
  startItem,
  endItem,
  onPrevious,
  onNext,
}) {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#E7E8F0] bg-white px-5 py-4 shadow-[0_14px_40px_rgba(17,24,39,0.05)] md:flex-row md:items-center">
      <p className="text-sm text-slate-500">
        Showing {startItem} to {endItem} of{" "}
        {totalItems} employees
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={page === 1}
          onClick={onPrevious}
          className="rounded-lg border border-[#E0E3EC] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F9FC] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm font-semibold text-slate-700">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          disabled={page === totalPages}
          onClick={onNext}
          className="rounded-lg border border-[#E0E3EC] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F9FC] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default EmployeePagination;
