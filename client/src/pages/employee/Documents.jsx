import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiFolder, FiFile, FiDownload, FiEye, FiSearch,
  FiUpload, FiFileText, FiImage, FiLock,
  FiCheckCircle, FiClock, FiX, FiPaperclip,
} from "react-icons/fi";
import { getDocuments, uploadDocument } from "../../services/documentService";
import getStoredUser from "../../utils/authStorage";

const DOCUMENT_CATEGORIES = [
  {
    id: "personal", label: "Personal Documents", icon: FiFile,
    color: "bg-blue-50 text-blue-600",
    docs: [],
  },
  {
    id: "education", label: "Education Certificates", icon: FiFileText,
    color: "bg-purple-50 text-purple-600",
    docs: [],
  },
  {
    id: "employment", label: "Employment Documents", icon: FiLock,
    color: "bg-green-50 text-green-600",
    docs: [],
  },
  {
    id: "company", label: "Company Issued", icon: FiImage,
    color: "bg-amber-50 text-amber-600",
    docs: [],
  },
];

const STATUS_STYLE = {
  Verified: "bg-green-50 text-green-700",
  Pending:  "bg-amber-50 text-amber-700",
  Signed:   "bg-blue-50 text-blue-700",
};
const STATUS_ICON = {
  Verified: FiCheckCircle,
  Pending:  FiClock,
  Signed:   FiCheckCircle,
};

const EMPTY_DOCUMENT_CATEGORIES = DOCUMENT_CATEGORIES.map((category) => ({
  ...category,
  docs: [],
}));

const folderToCategoryId = (folder = "") => {
  const value = folder.toLowerCase();
  if (value.includes("education")) return "education";
  if (value.includes("employment")) return "employment";
  if (value.includes("company")) return "company";
  return "personal";
};

const normalizeDocument = (doc = {}) => ({
  ...doc,
  id: doc.id || doc._id,
  type: doc.type || doc.name?.split(".").pop()?.toUpperCase() || "FILE",
  uploadedOn: doc.uploadedOn || doc.date || "-",
  status: doc.status || "Pending",
});

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const downloadDocument = (doc) => {
  if (!doc.fileData && !doc.fileUrl) {
    toast.error("No file is attached to this document.");
    return;
  }

  const link = document.createElement("a");
  link.href = doc.fileData || doc.fileUrl;
  link.download = doc.originalName || doc.name || "document";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function DocumentPreviewModal({ doc, onClose }) {
  const source = doc?.fileData || doc?.fileUrl;
  const isImage = doc?.mimeType?.startsWith("image/") || ["JPG", "JPEG", "PNG"].includes(doc?.type);
  const isPdf = doc?.mimeType === "application/pdf" || doc?.type === "PDF";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#E7E8F0] bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E7E8F0] px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">{doc?.name}</h2>
            <p className="text-xs text-slate-400">
              {doc?.type || "Document"} · {doc?.size || "Unknown size"} · {doc?.uploadedOn || doc?.date || "-"}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-[#F6F7FB] hover:text-slate-700">
            <FiX />
          </button>
        </div>

        <div className="min-h-[360px] flex-1 bg-[#F8F9FC] p-4">
          {!source ? (
            <div className="flex h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-[#DDE1EC] bg-white text-center">
              <FiFileText className="mb-3 text-4xl text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No preview file attached</p>
            </div>
          ) : isImage ? (
            <img src={source} alt={doc?.name} className="mx-auto max-h-[62vh] max-w-full rounded-xl object-contain" />
          ) : isPdf ? (
            <iframe title={doc?.name} src={source} className="h-[62vh] w-full rounded-xl border border-[#E7E8F0] bg-white" />
          ) : (
            <div className="flex h-[360px] flex-col items-center justify-center rounded-xl border border-[#E7E8F0] bg-white text-center">
              <FiFileText className="mb-3 text-4xl text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Preview not supported</p>
              <button type="button" onClick={() => downloadDocument(doc)}
                className="mt-4 rounded-xl bg-[#302568] px-4 py-2 text-xs font-semibold text-white">
                Download file
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUploaded }) {
  const user = getStoredUser();
  const [dragOver,  setDragOver]  = useState(false);
  const [file,      setFile]      = useState(null);
  const [docType,   setDocType]   = useState("Personal Document");
  const [docName,   setDocName]   = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!docName.trim()) return toast.error("Please enter a document name");
    if (!file)           return toast.error("Please select a file");

    setUploading(true);
    try {
      const fileData = await readFileAsDataUrl(file);

      const result = await uploadDocument({
        name:         docName,
        folder:       docType,
        size:         `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        uploadedBy:   user?.name || "Employee",
        date:         new Date().toISOString().slice(0, 10),
        status:       "Pending",
        type:         file.name.split(".").pop().toUpperCase(),
        uploadedOn:   new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        fileData,
        mimeType:     file.type,
        originalName: file.name,
      });

      toast.success("Document uploaded successfully!");
      onUploaded?.(result);
      onClose();
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E7E8F0] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E7E8F0] px-6 py-4">
          <h2 className="font-bold text-slate-900">Upload Document</h2>
          <button type="button" onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-[#F6F7FB]">
            <FiX />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* Doc type */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Document Type <span className="text-red-400">*</span>
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full rounded-xl border border-[#E7E8F0] bg-[#FAFAFD] px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#7560A7] focus:ring-2 focus:ring-[#302568]/10"
            >
              <option>Personal Document</option>
              <option>Education Certificate</option>
              <option>Employment Document</option>
              <option>Company Issued</option>
              <option>Other</option>
            </select>
          </div>

          {/* Doc name */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Document Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Aadhar Card, Degree Certificate"
              className="w-full rounded-xl border border-[#E7E8F0] bg-[#FAFAFD] px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#7560A7] focus:ring-2 focus:ring-[#302568]/10 placeholder:text-slate-300"
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
            }}
            className={[
              "cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition",
              dragOver
                ? "border-[#302568] bg-[#F5F3FC]"
                : "border-[#E7E8F0] bg-[#FAFAFD] hover:border-[#302568]/40 hover:bg-[#F5F3FC]",
            ].join(" ")}
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FiPaperclip className="text-3xl text-[#302568]" />
                <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button type="button" onClick={() => setFile(null)}
                  className="text-xs text-red-500 underline">
                  Remove
                </button>
              </div>
            ) : (
              <>
                <FiUpload className="mx-auto mb-2 text-3xl text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Drag & drop file here</p>
                <p className="mt-1 text-xs text-slate-400">or click to browse</p>
                <p className="mt-2 text-xs text-slate-300">PDF, JPG, PNG up to 10MB</p>
                <label className="mt-4 inline-block cursor-pointer rounded-xl border border-[#E7E8F0] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-[#F6F7FB]">
                  Browse File
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </label>
              </>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-[#E7E8F0] py-2.5 text-sm font-semibold text-slate-600 hover:bg-[#F6F7FB]">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 rounded-xl bg-[#302568] py-2.5 text-sm font-semibold text-white transition hover:bg-[#3d3080] disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload Document"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function EmployeeDocuments() {
  const [categories,  setCategories]  = useState(EMPTY_DOCUMENT_CATEGORIES);
  const [search,      setSearch]      = useState("");
  const [activeTab,   setActiveTab]   = useState("all");
  const [showUpload,  setShowUpload]  = useState(false);
  const [previewDoc,  setPreviewDoc]  = useState(null);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const docs = await getDocuments();
        setCategories(
          EMPTY_DOCUMENT_CATEGORIES.map((category) => ({
            ...category,
            docs: docs
              .filter((doc) => folderToCategoryId(doc.folder) === category.id)
              .map(normalizeDocument),
          }))
        );
      } catch {
        toast.error("Failed to load documents");
      }
    };
    loadDocuments();
  }, []);

  const allDocs = categories.flatMap((c) => c.docs.map((d) => ({ ...d, category: c.label })));
  const totalVerified = allDocs.filter((d) => d.status === "Verified" || d.status === "Signed").length;

  const filtered = allDocs.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchTab    = activeTab === "all" || d.status.toLowerCase() === activeTab;
    return matchSearch && matchTab;
  });

  // Add newly uploaded doc to Personal Documents category
  const handleUploaded = (doc) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === folderToCategoryId(doc.folder)
          ? { ...c, docs: [normalizeDocument(doc), ...c.docs] }
          : c
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Documents</h1>
          <p className="text-sm text-slate-400">
            {totalVerified} of {allDocs.length} documents verified
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 rounded-xl bg-[#302568] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3d3080]"
        >
          <FiUpload /> Upload Document
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total",    tab: "all",      count: allDocs.length,                                  color: "text-[#302568]",     bg: "bg-[#F5F3FC]" },
          { label: "Verified", tab: "verified", count: allDocs.filter((d) => d.status==="Verified").length, color: "text-green-700", bg: "bg-green-50"  },
          { label: "Pending",  tab: "pending",  count: allDocs.filter((d) => d.status==="Pending").length,  color: "text-amber-700", bg: "bg-amber-50"  },
          { label: "Signed",   tab: "signed",   count: allDocs.filter((d) => d.status==="Signed").length,   color: "text-blue-700",  bg: "bg-blue-50"   },
        ].map(({ label, tab, count, color, bg }) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              "rounded-2xl border bg-white p-4 text-center shadow-sm transition hover:border-[#7560A7] hover:bg-[#F8F7FC] focus:outline-none focus:ring-2 focus:ring-[#302568]/20",
              activeTab === tab ? "border-[#302568]" : "border-[#E7E8F0]",
            ].join(" ")}
          >
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-400">{label}</p>
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E7E8F0] bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-[#7560A7] focus:ring-2 focus:ring-[#302568]/10 placeholder:text-slate-300"
          />
        </div>
        <div className="flex rounded-xl border border-[#E7E8F0] bg-white p-1">
          {["all", "verified", "pending", "signed"].map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition",
                activeTab === tab ? "bg-[#302568] text-white" : "text-slate-500 hover:text-[#302568]",
              ].join(" ")}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Category view */}
      {activeTab === "all" && search === "" ? (
        <div className="space-y-5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.id} className="overflow-hidden rounded-2xl border border-[#E7E8F0] bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-[#F0F0F5] px-6 py-4">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cat.color}`}>
                    <Icon className="text-sm" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">{cat.label}</h2>
                  <span className="ml-auto rounded-full bg-[#F5F3FC] px-2.5 py-0.5 text-xs font-semibold text-[#302568]">
                    {cat.docs.length}
                  </span>
                </div>
                <div className="divide-y divide-[#F0F0F5]">
                  {cat.docs.map((doc) => {
                    const StatusIcon = STATUS_ICON[doc.status] || FiClock;
                    return (
                      <div key={doc.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 transition hover:bg-[#FAFAFD]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F3FC]">
                            <FiFolder className="text-sm text-[#302568]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                            <p className="text-xs text-slate-400">{doc.type} · {doc.size} · {doc.uploadedOn}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[doc.status]}`}>
                            <StatusIcon className="text-[10px]" /> {doc.status}
                          </span>
                          <button type="button" title="View"
                            onClick={() => setPreviewDoc(doc)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-[#F5F3FC] hover:text-[#302568]">
                            <FiEye className="text-sm" />
                          </button>
                          <button type="button" title="Download"
                            onClick={() => downloadDocument(doc)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-[#F5F3FC] hover:text-[#302568]">
                            <FiDownload className="text-sm" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E7E8F0] bg-white shadow-sm">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FiFolder className="mx-auto mb-3 text-4xl opacity-30" />
              <p className="text-sm font-medium">No documents found</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0F5]">
              {filtered.map((doc) => {
                const StatusIcon = STATUS_ICON[doc.status] || FiClock;
                return (
                  <div key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 transition hover:bg-[#FAFAFD]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F3FC]">
                        <FiFolder className="text-sm text-[#302568]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                        <p className="text-xs text-slate-400">{doc.category} · {doc.type} · {doc.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[doc.status]}`}>
                        <StatusIcon className="text-[10px]" /> {doc.status}
                      </span>
                      <button type="button" onClick={() => setPreviewDoc(doc)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-[#F5F3FC] hover:text-[#302568]">
                        <FiEye className="text-sm" />
                      </button>
                      <button type="button" onClick={() => downloadDocument(doc)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-[#F5F3FC] hover:text-[#302568]">
                        <FiDownload className="text-sm" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
        />
      )}
      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
