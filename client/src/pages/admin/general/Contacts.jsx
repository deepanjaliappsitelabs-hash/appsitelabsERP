import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../../components/layout/PageHeader";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import Table from "../../../components/ui/Table";
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

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(",")
    .map((header) =>
      header.replace(/^"|"$/g, "").trim().toLowerCase().replace(/\s+/g, "")
    );

  return lines
    .slice(1)
    .map((line) => {
      const values = [];
      let current = "";
      let inQuote = false;

      for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (character === '"') {
          inQuote = !inQuote;
          continue;
        }

        if (character === "," && !inQuote) {
          values.push(current.trim());
          current = "";
          continue;
        }

        current += character;
      }

      values.push(current.trim());

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? "";
      });

      return {
        name: row.name || row.fullname || row["fullname"] || "",
        company: row.company || row.organisation || row.organization || "",
        email: row.email || row["e-mail"] || "",
        phone: row.phone || row.mobile || row.contact || "",
        type: row.type || row.category || "Client",
      };
    })
    .filter((row) => row.name);
}

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyContact);
  const [importing, setImporting] = useState(false);
  const csvInputRef = useRef(null);

  useEffect(() => {
    getContacts()
      .then(setContacts)
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load contacts from database");
      });
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyContact);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData(emptyContact);
    setShowModal(true);
  };

  const openEdit = (contact) => {
    setEditingId(contact._id);
    setFormData({
      name: contact.name || "",
      company: contact.company || "",
      email: contact.email || "",
      phone: contact.phone || "",
      type: contact.type || "Client",
    });
    setShowModal(true);
  };

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleImportClick = () => {
    csvInputRef.current?.click();
  };

  const handleCSVFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a .csv file");
      event.target.value = "";
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

      const createdContacts = await Promise.all(
        rows.map((row) => createContact(row))
      );
      setContacts((current) => [...createdContacts, ...current]);
      toast.success(
        `${createdContacts.length} contact${
          createdContacts.length === 1 ? "" : "s"
        } imported`
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to import CSV");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingId) {
        const updated = await updateContact(editingId, formData);
        setContacts((current) =>
          current.map((contact) =>
            contact._id === editingId ? updated : contact
          )
        );
        toast.success("Contact updated");
      } else {
        const created = await createContact(formData);
        setContacts((current) => [created, ...current]);
        toast.success("Contact added");
      }

      closeModal();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save contact in database");
    }
  };

  const removeContact = async (id) => {
    if (!window.confirm("Delete this contact?")) return;

    try {
      await deleteContact(id);
      setContacts((current) => current.filter((contact) => contact._id !== id));
      toast.success("Contact deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete contact from database");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        subtitle="Manage client, vendor, and partner relationships."
        action={
          <div className="flex gap-3">
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
              {importing ? "Importing..." : "Import CSV"}
            </Button>
            <Button onClick={openAdd}>Add Contact</Button>
          </div>
        }
      />

      <div className="rounded-xl border border-[#E7E8F0] bg-[#FAFAFA] px-4 py-3 text-xs text-slate-500">
        <strong className="text-slate-700">CSV format:</strong> Columns should be{" "}
        <code className="rounded bg-slate-100 px-1">
          name, company, email, phone, type
        </code>{" "}
        (first row = headers, type = Client / Vendor / Partner)
      </div>

      <Table
        columns={["Name", "Company", "Email", "Phone", "Type", "Actions"]}
        data={contacts}
        renderRow={(contact) => (
          <tr key={contact._id}>
            <td className="px-4 py-4 font-semibold text-slate-950">
              {contact.name}
            </td>
            <td className="px-4 py-4">{contact.company || "-"}</td>
            <td className="px-4 py-4">{contact.email || "-"}</td>
            <td className="px-4 py-4">{contact.phone || "-"}</td>
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
        <Modal title={editingId ? "Edit Contact" : "Add Contact"} onClose={closeModal}>
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
                onClick={closeModal}
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

export default Contacts;
