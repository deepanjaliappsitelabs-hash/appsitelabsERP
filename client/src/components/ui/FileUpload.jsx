import { useRef } from "react";
import { FiCheckCircle, FiRefreshCw, FiTrash2, FiUploadCloud } from "react-icons/fi";

function FileUpload({
  label = "Upload file",
  name,
  multiple = false,
  accept,
  onChange,
  fileName = "",
  onClear,
}) {
  const inputRef = useRef(null);
  const isUploaded = Boolean(fileName);

  return (
    <div
      className={[
        "rounded-2xl border border-dashed p-5 text-center transition",
        isUploaded
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-[#CFC6FF] bg-[#FAFAFE] hover:bg-[#F1EDFF]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center"
      >
        <span
          className={[
            "mb-2 flex h-10 w-10 items-center justify-center rounded-full",
            isUploaded ? "bg-emerald-100 text-emerald-700" : "bg-[#F1EDFF] text-[#5B3FD6]",
          ].join(" ")}
        >
          {isUploaded ? <FiCheckCircle /> : <FiUploadCloud />}
        </span>
        <span className="block text-sm font-semibold text-slate-900">
          {label}
        </span>
        <span
          className={[
            "mt-1 block max-w-full truncate text-xs",
            isUploaded ? "font-semibold text-emerald-700" : "text-slate-500",
          ].join(" ")}
        >
          {isUploaded ? fileName : "Drag files here or click to browse"}
        </span>
      </button>

      {isUploaded && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            <FiRefreshCw />
            Replace
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            <FiTrash2 />
            Remove
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        name={name}
        multiple={multiple}
        accept={accept}
        onChange={onChange}
        className="sr-only"
      />
    </div>
  );
}

export default FileUpload;
