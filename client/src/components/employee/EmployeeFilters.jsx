import { FiSearch, FiX } from "react-icons/fi";

function EmployeeFilters({
  search,
  setSearch,
  departmentFilter,
  setDepartmentFilter,
  designationFilter,
  setDesignationFilter,
  designationOptions = [],
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-[#E7E8F0] bg-white/95 p-4 shadow-[0_18px_50px_rgba(48,37,104,0.08)] sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-[420px]">
        <span className="pointer-events-none absolute left-3.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#F1EDFF] text-[#302568]">
          <FiSearch className="text-sm" />
        </span>

        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="h-12 w-full rounded-2xl border border-[#E1DDF0] bg-[#FAFAFD] pl-14 pr-11 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-[#C7BDE7] hover:bg-white focus:border-[#7560A7] focus:bg-white focus:ring-4 focus:ring-[#302568]/10"
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-[#EDE8F5] hover:text-[#302568]"
            aria-label="Clear employee search"
            title="Clear search"
          >
            <FiX className="text-sm" />
          </button>
        )}
      </div>

      <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
        <select
          value={departmentFilter}
          onChange={(e) =>
            setDepartmentFilter(
              e.target.value
            )
          }
          className="h-12 w-full rounded-2xl border border-[#E1DDF0] bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition hover:border-[#C7BDE7] focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10 sm:w-[220px]"
        >
          <option value="">
            All Departments
          </option>

          <option value="HR">
            HR
          </option>

          <option value=" Web Developer">
            Web Developer
          </option>

          <option value="Full Stack Developer">
            Full Stack Developer
          </option>

          <option value="Frontend Developer">
            Frontend Developer
          </option>

          <option value="Backend Developer">
            Backend Developer
          </option>

          <option value="Graphic Designer">
            Graphic Designer
          </option>

          <option value="Marketing">
            Marketing
          </option>

          <option value="Astro Sales">
            Astro Sales
          </option>

          <option value="IT Sales">
            IT Sales
          </option>
        </select>

        <select
          value={designationFilter}
          onChange={(e) =>
            setDesignationFilter(
              e.target.value
            )
          }
          className="h-12 w-full rounded-2xl border border-[#E1DDF0] bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition hover:border-[#C7BDE7] focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10 sm:w-[220px]"
        >
          <option value="">
            All Designations
          </option>

          {designationOptions.map((designation) => (
            <option key={designation} value={designation}>
              {designation}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default EmployeeFilters;
