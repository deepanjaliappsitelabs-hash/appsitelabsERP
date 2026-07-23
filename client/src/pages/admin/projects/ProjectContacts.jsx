import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import Table from "../../../components/ui/Table";
import PageHeader from "../../../components/layout/PageHeader";
import {
  createContact,
  deleteContact,
  getContacts,
  updateContact,
} from "../../../services/projectService";

const emptyContact = {
  name: "",
  company: "",
  email: "",
  phone: "",
  type: "Client",
};

// ── CSV Import helper ─────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // normalise header → lowercase, no spaces
  const headers = lines[0].split(",").map((h) =>
    h.replace(/^"|"$/g, "").trim().toLowerCase().replace(/\s+/g, "")
  );

  return lines.slice(1).map((line) => {
    // handle quoted fields with commas inside
    const values = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { values.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    values.push(cur.trim());

    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });

    // map common CSV column names → our field names
    return {
      name:    obj.name    || obj.fullname || obj["full name"] || "",
      company: obj.company || obj.organisation || obj.organization || "",
      email:   obj.email   || obj["e-mail"] || "",
      phone:   obj.phone   || obj.mobile || obj.contact || "",
      type:    obj.type    || obj.category || "Client",
    };
  }).filter((r) => r.name); // skip blank rows
}

// ── Main ──────────────────────────────────────────────────────────────────────
function ProjectContacts() {
  const [contacts, setContacts]   = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData]   = useState(emptyContact);
  const [importing, setImporting] = useState(false);
  const csvInputRef = useRef(null);

  useEffect(() => {
    getContacts().then(setContacts);
  }, []);

  // ── Import CSV ──────────────────────────────────────────────────────────────
  const handleImportClick = () => csvInputRef.current?.click();

  const handleCSVFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a .csv file");
      e.target.value = "";
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (!rows.length) {
        toast.error("No valid rows found in CSV");
        return;
      }

      // Save each row to the backend
      const created = await Promise.all(rows.map((r) => createContact(r)));
      setContacts((prev) => [...created, ...prev]);
      toast.success(`${created.length} contact${created.length !== 1 ? "s" : ""} imported!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to import CSV");
    } finally {
      setImporting(false);
      e.target.value = ""; // reset so same file can be re-imported
    }
  };

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setFormData(emptyContact);
    setShowModal(true);
  };

  const openEdit = (contact) => {
    setEditingId(contact._id);
    setFormData({ ...contact });
    setShowModal(true);
  };

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (editingId) {
      const updated = await updateContact(editingId, formData);
      setContacts((cur) =>
        cur.map((c) => (c._id === editingId ? updated : c))
      );
      toast.success("Contact updated");
    } else {
      const created = await createContact(formData);
      setContacts((cur) => [created, ...cur]);
      toast.success("Contact added");
    }
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyContact);
  };

  const removeContact = async (id) => {
    if (!window.confirm("Delete this contact?")) return;
    await deleteContact(id);
    setContacts((cur) => cur.filter((c) => c._id !== id));
    toast.success("Contact deleted");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Contacts"
        subtitle="Manage client, vendor, and partner relationships."
        action={
          <div className="flex gap-3">
            {/* Hidden file input */}
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVFile}
            />
            <Button
              className="bg-slate-900 hover:bg-slate-800"
              onClick={handleImportClick}
              disabled={importing}
            >
              {importing ? "Importing…" : "Import CSV"}
            </Button>
            <Button onClick={openAdd}>Add Contact</Button>
          </div>
        }
      />

      {/* CSV format hint */}
      <div className="rounded-xl border border-[#E7E8F0] bg-[#FAFAFA] px-4 py-3 text-xs text-slate-500">
        <strong className="text-slate-700">CSV format:</strong> Columns should be{" "}
        <code className="rounded bg-slate-100 px-1">name, company, email, phone, type</code>
        {" "}(first row = headers, type = Client / Vendor / Partner)
      </div>

      <Table
        columns={["Name", "Company", "Email", "Phone", "Type", "Actions"]}
        data={contacts}
        renderRow={(contact) => (
          <tr key={contact._id}>
            <td className="px-4 py-4 font-semibold text-slate-950">
              {contact.name}
            </td>
            <td className="px-4 py-4">{contact.company || "—"}</td>
            <td className="px-4 py-4">{contact.email || "—"}</td>
            <td className="px-4 py-4">{contact.phone || "—"}</td>
            <td className="px-4 py-4">
              <Badge variant="primary">{contact.type}</Badge>
            </td>
            <td className="px-4 py-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(contact)}
                  className="rounded-lg bg-[#F1EDFF] px-3 py-2 text-sm font-semibold text-[#5B3FD6]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeContact(contact._id)}
                  className="rounded-lg bg-[#FEF3F2] px-3 py-2 text-sm font-semibold text-[#B42318]"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      {showModal && (
        <Modal
          title={editingId ? "Edit Contact" : "Add Contact"}
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
            setFormData(emptyContact);
          }}
        >
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <Input
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              label="Company"
              name="company"
              value={formData.company}
              onChange={handleChange}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
            <Select
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              options={["Client", "Vendor", "Partner"]}
            />
            <div className="flex justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setFormData(emptyContact);
                }}
                className="rounded-xl border border-[#E0E3EC] px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <Button type="submit">
                {editingId ? "Update Contact" : "Save Contact"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default ProjectContacts;