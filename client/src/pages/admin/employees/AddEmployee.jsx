import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FiCamera, FiEye, FiEyeOff, FiUser } from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import FileUpload from "../../../components/ui/FileUpload";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { createEmployee } from "../../../services/employeeService";

const steps = ["Personal Info", "Job Details", "Bank Details", "Documents"];
const finalStepIndex = steps.length - 1;

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1949 }, (_, i) => String(currentYear - i));
const months = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

const daysInMonth = (year, month) => {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
};

const splitIsoDate = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return {
    year: match?.[1] || "",
    month: match?.[2] || "",
    day: match?.[3] || "",
  };
};

const joinIsoDate = ({ year, month, day }) =>
  year && month && day ? `${year}-${month}-${day}` : "";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  address: "",
  emergencyContact: "",
  department: "",
  designation: "",
  employeeId: "ASL-001",
  joiningDate: new Date().toISOString().slice(0, 10),
  password: "",
  salary: "",
  role: "Employee",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  panNumber: "",
  documents: {},
  photo: "",        // base64 preview
  photoFile: null,  // actual File object
};

// ── Photo Upload Widget ───────────────────────────────────────────────────────
function PhotoUpload({ preview, onChange }) {
  const inputRef = useRef(null);

  return (
    <div className="md:col-span-2 flex flex-col items-center gap-3 pb-2">
      {/* Circle preview */}
      <div
        className="relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-[#E7E8F0] bg-[#F1EDFF] shadow-sm transition hover:border-[#5B3FD6]"
        onClick={() => inputRef.current?.click()}
        title="Click to upload photo"
      >
        {preview ? (
          <img
            src={preview}
            alt="Employee"
            className="h-full w-full object-cover"
          />
        ) : (
          <FiUser className="text-4xl text-[#5B3FD6]" />
        )}

        {/* Camera overlay */}
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

      <div className="text-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-semibold text-[#5B3FD6] underline underline-offset-2"
        >
          {preview ? "Change photo" : "Upload photo"}
        </button>
        <p className="mt-0.5 text-xs text-slate-400">
          JPG, PNG or WEBP · max 2 MB
        </p>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
function AddEmployee() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [dobDraft, setDobDraft] = useState({ day: "", month: "", year: "" });
  const [showPassword, setShowPassword] = useState(false);
  const dobParts = formData.dob ? splitIsoDate(formData.dob) : dobDraft;
  const dobDays = Array.from(
    { length: daysInMonth(dobParts.year, dobParts.month) },
    (_, i) => String(i + 1).padStart(2, "0")
  );

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleDobChange = (part, value) => {
    setDobDraft((prev) => {
      const next = { ...prev, [part]: value };
      const maxDay = daysInMonth(next.year, next.month);
      if (next.day && Number(next.day) > maxDay) {
        next.day = String(maxDay).padStart(2, "0");
      }

      setFormData((current) => ({ ...current, dob: joinIsoDate(next) }));
      return next;
    });
  };

  const validatePersonalInfo = () => {
    const phoneDigits = formData.phone.replace(/\D/g, "");
    const emergencyDigits = formData.emergencyContact.replace(/\D/g, "");
    const hasPartialDob = dobParts.day || dobParts.month || dobParts.year;
    const hasFullDob = dobParts.day && dobParts.month && dobParts.year;

    if (hasPartialDob && !hasFullDob) {
      toast.error("DOB ke liye date, month aur year teeno select karo");
      return false;
    }

    const dob = joinIsoDate(dobParts);
    if (dob && dob > new Date().toISOString().slice(0, 10)) {
      toast.error("DOB future date nahi ho sakti");
      return false;
    }

    if (formData.phone && phoneDigits.length !== 10) {
      toast.error("Phone number 10 digits ka hona chahiye");
      return false;
    }

    if (formData.emergencyContact && emergencyDigits.length !== 10) {
      toast.error("Emergency contact 10 digits ka hona chahiye");
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (step === 0 && !validatePersonalInfo()) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [e.target.name]: file?.name || "",
      },
    }));
    e.target.value = "";
  };

  const handleFileClear = (name) => {
    setFormData((prev) => {
      const nextDocuments = { ...prev.documents };
      delete nextDocuments[name];
      return {
        ...prev,
        documents: nextDocuments,
      };
    });
  };

  // Photo upload — read as base64 for preview + store File
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload JPG, PNG or WEBP image");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo must be under 2 MB");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        photo: reader.result,   // base64 data URL for preview
        photoFile: file,
      }));
    };
    reader.onerror = () => toast.error("Photo preview load nahi hua, please try again");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== finalStepIndex) return;

    try {
      // Pass base64 photo to backend (or upload separately via FormData)
      const payload = {
        ...formData,
        dob: joinIsoDate(dobParts),
        phone: formData.phone.replace(/\D/g, ""),
        emergencyContact: formData.emergencyContact.replace(/\D/g, ""),
      };
      delete payload.photoFile; // don't send File object as JSON
      await createEmployee(payload);
      toast.success("Employee and login account created");
      navigate("/admin/employees");
    } catch (err) {
      toast.error(err.response?.data?.message || "Employee creation failed");
    }
  };

  const handleFormKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Employee"
        subtitle="Create a complete employee profile in four quick steps."
      />

      <Card>
        {/* Step tabs */}
        <div className="mb-8 grid gap-3 md:grid-cols-4">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={[
                "rounded-xl border px-4 py-3 text-left text-sm font-semibold transition",
                step === index
                  ? "border-[#5B3FD6] bg-[#F1EDFF] text-[#5B3FD6]"
                  : "border-[#E7E8F0] text-slate-500 hover:bg-[#F8F9FC]",
              ].join(" ")}
            >
              <span className="block text-xs text-slate-400">
                Step {index + 1}
              </span>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>

          {/* ── Step 1: Personal Info ── */}
          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">

              {/* Photo upload — full width, centred */}
              <PhotoUpload
                preview={formData.photo}
                onChange={handlePhotoChange}
              />

              <Input
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <Input
                label="Phone"
                name="phone"
                type="tel"
                inputMode="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9851357474"
              />
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  DOB
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={dobParts.day}
                    onChange={(e) => handleDobChange("day", e.target.value)}
                    className="w-full rounded-xl border border-[#E0E3EC] bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10"
                  >
                    <option value="">Date</option>
                    {dobDays.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <select
                    value={dobParts.month}
                    onChange={(e) => handleDobChange("month", e.target.value)}
                    className="w-full rounded-xl border border-[#E0E3EC] bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10"
                  >
                    <option value="">Month</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                  <select
                    value={dobParts.year}
                    onChange={(e) => handleDobChange("year", e.target.value)}
                    className="w-full rounded-xl border border-[#E0E3EC] bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10"
                  >
                    <option value="">Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </label>
              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={[
                  { value: "", label: "Select gender" },
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                  { value: "Other", label: "Other" },
                ]}
              />
              <Input
                label="Blood Group"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                placeholder="e.g. B+"
              />
              <Input
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
              <Input
                label="Emergency Contact"
                name="emergencyContact"
                type="tel"
                inputMode="tel"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
              />
            </div>
          )}

          {/* ── Step 2: Job Details ── */}
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                options={[
                  { value: "", label: "Select department" },
                  "Web Developer",
                  "Full Stack Developer",
                  "Frontend Developer",
                  "Backend Developer",
                  "Graphic Designer",
                  "HR",
                  "Marketing",
                  "Astro Sales",
                  "IT Sales",
                ]}
              />
              <Input
                label="Designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
              />
              <Input
                label="Employee ID"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
              />
              <Input
                label="Join Date"
                name="joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={handleChange}
              />
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Login Password
                </span>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-[#E0E3EC] bg-white px-3.5 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-[#302568]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>
              <Input
                label="Salary (₹)"
                name="salary"
                type="number"
                value={formData.salary}
                onChange={handleChange}
              />
              <Select
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                options={["Employee", "Admin", "HR"]}
              />
            </div>
          )}

          {/* ── Step 3: Bank Details ── */}
          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Bank Name"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
              />
              <Input
                label="Account Number"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
              />
              <Input
                label="IFSC Code"
                name="ifsc"
                value={formData.ifsc}
                onChange={handleChange}
              />
              <Input
                label="PAN Number"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
              />
            </div>
          )}

          {/* ── Step 4: Documents ── */}
          {step === 3 && (
            <div className="grid gap-4 md:grid-cols-2">
              {["Aadhaar", "PAN", "Resume", "Offer Letter"].map((label) => {
                const name = label.toLowerCase().replace(" ", "");
                return (
                  <FileUpload
                    key={label}
                    label={`Upload ${label}`}
                    name={name}
                    fileName={formData.documents[name] || ""}
                    onChange={handleFileChange}
                    onClear={() => handleFileClear(name)}
                  />
                );
              })}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => setStep((c) => Math.max(c - 1, 0))}
              className="rounded-xl border border-[#E0E3EC] px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F9FC]"
            >
              Previous
            </button>
            {step < finalStepIndex ? (
              <Button
                type="button"
                onClick={goNext}
              >
                Next
              </Button>
            ) : (
              <Button type="submit">Create Employee</Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

export default AddEmployee;
