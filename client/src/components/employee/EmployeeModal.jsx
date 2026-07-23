import { useRef } from "react";
import { FiCamera, FiUser } from "react-icons/fi";
import "react-hot-toast";
import Button from "../ui/Button";
import FileUpload from "../ui/FileUpload";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

const SECTION = "mb-2 text-xs font-bold uppercase tracking-widest text-slate-400";

// ── Photo Upload (same as AddEmployee) ────────────────────────────────────────
function PhotoUpload({ preview, onChange }) {
  const inputRef = useRef(null);
  return (
    <div className="md:col-span-2 flex flex-col items-center gap-3 pb-2">
      <div
        className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-[#E7E8F0] bg-[#F1EDFF] shadow-sm transition hover:border-[#5B3FD6]"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Employee" className="h-full w-full object-cover" />
        ) : (
          <FiUser className="text-4xl text-[#5B3FD6]" />
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition hover:opacity-100">
          <FiCamera className="text-2xl text-white" />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-sm font-semibold text-[#5B3FD6] underline underline-offset-2"
      >
        {preview ? "Change photo" : "Upload photo"}
      </button>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
function EmployeeModal({
  showModal,
  setShowModal,
  isEditing,
  formData,
  handleChange,
  handleSubmit,
  onPhotoChange,
  onDocumentChange,
  onDocumentClear,
}) {
  if (!showModal) return null;

  return (
    <Modal
      title={isEditing ? "Edit Employee" : "Add Employee"}
      onClose={() => setShowModal(false)}
      className="max-w-4xl"
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[78vh] overflow-y-auto pr-1"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* Photo */}
          <PhotoUpload
            preview={formData.photo}
            onChange={onPhotoChange}
          />

          {/* ── Personal Info ── */}
          <p className={`${SECTION} md:col-span-2`}>Personal Info</p>

          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
          <Input
            label="Date of Birth"
            type="date"
            name="dob"
            value={formData.dob || ""}
            onChange={handleChange}
            max={new Date().toISOString().slice(0, 10)}
          />
          <Select
            label="Gender"
            name="gender"
            value={formData.gender || ""}
            onChange={handleChange}
            options={[
              { value: "",       label: "Select gender" },
              { value: "Male",   label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Other",  label: "Other" },
            ]}
          />
          <Input
            label="Blood Group"
            name="bloodGroup"
            value={formData.bloodGroup || ""}
            onChange={handleChange}
            placeholder="e.g. B+"
          />
          <Input
            label="Address"
            name="address"
            value={formData.address || ""}
            onChange={handleChange}
          />
          <Input
            label="Emergency Contact"
            name="emergencyContact"
            type="tel"
            inputMode="tel"
            value={formData.emergencyContact || ""}
            onChange={handleChange}
            placeholder="e.g. 9876543210"
          />

          {/* ── Job Details ── */}
          <p className={`${SECTION} md:col-span-2 mt-2`}>Job Details</p>

          <Select
            label="Department"
            name="department"
            value={formData.department || ""}
            onChange={handleChange}
            options={[
              { value: "",               label: "Select department" },
              { value: "Development",    label: "Development" },
              { value: "Design",         label: "Design" },
              { value: "HR",             label: "HR" },
              { value: "Marketing",      label: "Marketing" },
              { value: "Operations",     label: "Operations" },
              { value: "Web Development", label: "Web Development" },
            ]}
          />
          <Input
            label="Designation"
            name="designation"
            value={formData.designation || ""}
            onChange={handleChange}
          />
          <Input
            label="Employee ID"
            name="employeeId"
            value={formData.employeeId || ""}
            onChange={handleChange}
          />
          <Input
            label="Joining Date"
            type="date"
            name="joiningDate"
            value={formData.joiningDate ? formData.joiningDate.slice(0, 10) : ""}
            onChange={handleChange}
          />
          <Input
            label="Salary (₹)"
            type="number"
            name="salary"
            value={formData.salary || ""}
            onChange={handleChange}
          />
          <Select
            label="Role"
            name="role"
            value={formData.role || "Employee"}
            onChange={handleChange}
            options={["Employee", "Admin", "HR"]}
          />

          {/* ── Bank Details ── */}
          <p className={`${SECTION} md:col-span-2 mt-2`}>Bank Details</p>

          <Input
            label="Bank Name"
            name="bankName"
            value={formData.bankName || ""}
            onChange={handleChange}
          />
          <Input
            label="Account Number"
            name="accountNumber"
            value={formData.accountNumber || ""}
            onChange={handleChange}
          />
          <Input
            label="IFSC Code"
            name="ifsc"
            value={formData.ifsc || ""}
            onChange={handleChange}
          />
          <Input
            label="PAN Number"
            name="panNumber"
            value={formData.panNumber || ""}
            onChange={handleChange}
          />

          {/* ── Documents ── */}
          <p className={`${SECTION} md:col-span-2 mt-2`}>Documents</p>

          {["Aadhaar", "PAN", "Resume", "Offer Letter"].map((label) => {
            const name = label.toLowerCase().replace(" ", "");
            return (
              <FileUpload
                key={label}
                label={`Upload ${label}`}
                name={name}
                fileName={formData.documents?.[name] || ""}
                onChange={onDocumentChange}
                onClear={() => onDocumentClear(name)}
              />
            );
          })}

          {/* Actions */}
          <div className="flex justify-end gap-3 md:col-span-2 mt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-xl border border-[#E0E3EC] px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F9FC]"
            >
              Cancel
            </button>
            <Button type="submit">
              {isEditing ? "Update Employee" : "Add Employee"}
            </Button>
          </div>

        </div>
      </form>
    </Modal>
  );
}

export default EmployeeModal;
