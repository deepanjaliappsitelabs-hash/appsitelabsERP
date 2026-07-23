import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import FileUpload from "../../../components/ui/FileUpload";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Table from "../../../components/ui/Table";
import {
  deleteDocument,
  getDocuments,
  uploadDocument,
} from "../../../services/documentService";

const emptyDocument = {
  name: "",
  folder: "Company Policies",
  uploadedBy: "Admin",
  file: null,
};

function formatBytes(bytes = 0) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizeDocument(document) {
  return {
    ...document,
    _id: document._id || document.id,
    uploadedBy: document.uploadedBy || document.uploaded_by || "Admin",
  };
}

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyDocument);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getDocuments()
      .then((items) => setDocuments(items.map(normalizeDocument)))
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load documents from database");
      });
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setFormData(emptyDocument);
  };

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormData((current) => ({
      ...current,
      file,
      name: current.name || file.name,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Document name is required");
      return;
    }

    setUploading(true);
    try {
      const fileData = formData.file
        ? await readFileAsDataUrl(formData.file)
        : null;
      const created = normalizeDocument(
        await uploadDocument({
          name: formData.name,
          folder: formData.folder,
          uploadedBy: formData.uploadedBy,
          size: formData.file ? formatBytes(formData.file.size) : "0 KB",
          fileData,
          mimeType: formData.file?.type || null,
        })
      );

      setDocuments((current) => [created, ...current]);
      toast.success("Document uploaded");
      closeModal();
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (id) => {
    if (!window.confirm("Delete this document?")) return;

    try {
      await deleteDocument(id);
      setDocuments((current) =>
        current.filter((document) => document._id !== id)
      );
      toast.success("Document deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete document from database");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle="Upload and organize company, employee, and vendor documents."
        action={
          <Button onClick={() => setShowModal(true)}>
            <FiPlus /> Upload Document
          </Button>
        }
      />

      <Table
        columns={["Name", "Folder", "Size", "Uploaded By", "Date", "Actions"]}
        data={documents}
        renderRow={(document) => (
          <tr key={document._id}>
            <td className="px-4 py-4 font-semibold text-slate-950">
              {document.name}
            </td>
            <td className="px-4 py-4">
              <Badge variant="primary">{document.folder || "General"}</Badge>
            </td>
            <td className="px-4 py-4">{document.size || "-"}</td>
            <td className="px-4 py-4">{document.uploadedBy || "Admin"}</td>
            <td className="px-4 py-4">
              {document.date
                ? new Date(document.date).toLocaleDateString("en-IN")
                : "-"}
            </td>
            <td className="px-4 py-4">
              <button
                type="button"
                onClick={() => removeDocument(document._id)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#FEF3F2] px-3 py-2 text-sm font-semibold text-[#B42318]"
              >
                <FiTrash2 /> Delete
              </button>
            </td>
          </tr>
        )}
      />

      {showModal && (
        <Modal title="Upload Document" onClose={closeModal}>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <Input
              label="Document Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              label="Folder"
              name="folder"
              value={formData.folder}
              onChange={handleChange}
            />
            <Input
              label="Uploaded By"
              name="uploadedBy"
              value={formData.uploadedBy}
              onChange={handleChange}
            />
            <div className="md:col-span-2">
              <FileUpload
                label="Choose document"
                name="document"
                fileName={formData.file?.name || ""}
                onChange={handleFileChange}
                onClear={() =>
                  setFormData((current) => ({ ...current, file: null }))
                }
              />
            </div>
            <div className="flex justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-[#E0E3EC] px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Documents;
