import { useState } from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiEdit2,
  FiSave,
  FiX,
  FiCamera,
  FiLock,
  FiCheckCircle,
  FiShield,
  FiGlobe,
  FiGithub,
  FiLinkedin,
} from "react-icons/fi";
import getStoredUser from "../../utils/authStorage";

// ── Input styles (same as DailyWorkLog) ──────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-[#E7E8F0] bg-[#FAFAFD] px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#302568] focus:ring-2 focus:ring-[#302568]/10 placeholder:text-slate-300 disabled:cursor-not-allowed disabled:opacity-60";

function Label({ children }) {
  return (
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </label>
  );
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <div className="rounded-2xl border border-[#E7E8F0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#F0F0F5] px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F3FC]">
            <Icon className="text-sm text-[#302568]" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

const EMPTY_PROFILE = {
  name: "",
  id: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  address: "",
  department: "",
  designation: "",
  joiningDate: "",
  employeeType: "",
  reportingTo: "",
  workLocation: "",
  linkedin: "",
  github: "",
  portfolio: "",
  skills: [],
  emergencyContact: {
    name: "",
    relation: "",
    phone: "",
  },
};

// ── Change Password Section ───────────────────────────────────────────────────
function ChangePassword() {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!form.current || !form.newPass || !form.confirm) {
      setError("All fields are required"); return;
    }
    if (form.newPass !== form.confirm) {
      setError("Passwords do not match"); return;
    }
    if (form.newPass.length < 8) {
      setError("Password must be at least 8 characters"); return;
    }
    setError("");
    setSaved(true);
    setTimeout(() => { setSaved(false); setForm({ current: "", newPass: "", confirm: "" }); }, 2500);
  };

  return (
    <div className="space-y-4">
      {["current", "newPass", "confirm"].map((field) => (
        <div key={field}>
          <Label>
            {field === "current" ? "Current Password" : field === "newPass" ? "New Password" : "Confirm New Password"}
          </Label>
          <input
            type="password"
            placeholder="••••••••"
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className={inputCls}
          />
        </div>
      ))}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {saved && (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
          <FiCheckCircle /> Password updated successfully!
        </p>
      )}
      <button
        type="button"
        onClick={handleSave}
        className="flex items-center gap-2 rounded-xl bg-[#302568] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d3080] transition"
      >
        <FiLock className="text-xs" /> Update Password
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Profile() {
  const storedUser = getStoredUser();
  const [profile,  setProfile]  = useState({ ...EMPTY_PROFILE, ...storedUser });
  const [editing,  setEditing]  = useState(false);
  const [draft,    setDraft]    = useState({ ...profile });
  const [saved,    setSaved]    = useState(false);

  const startEdit = () => { setDraft({ ...profile }); setEditing(true); };
  const cancelEdit = () => setEditing(false);

  const saveEdit = () => {
    setProfile({ ...draft });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const field = (key) => editing ? draft[key] || "" : profile[key] || "";
  const setField = (key, val) => setDraft((p) => ({ ...p, [key]: val }));

  return (
    <div className="min-h-screen bg-[#F6F7FB] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">My Profile</h1>
            <p className="text-sm text-slate-400">View and manage your personal information</p>
          </div>
          {saved && (
            <span className="flex items-center gap-1.5 rounded-xl bg-green-50 px-4 py-2 text-xs font-semibold text-green-700">
              <FiCheckCircle /> Saved!
            </span>
          )}
        </div>

        {/* ── Profile Hero ── */}
        <div className="rounded-2xl border border-[#E7E8F0] bg-white shadow-sm overflow-hidden">
          {/* Banner */}
          <div className="h-20 bg-gradient-to-r from-[#302568] to-[#5a47a3]" />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-10 mb-4 inline-block">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-[#302568] text-2xl font-bold text-white shadow-md">
                {(profile.name || "U").charAt(0).toUpperCase()}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#302568] text-white shadow"
                title="Change photo"
              >
                <FiCamera className="text-xs" />
              </button>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{profile.name}</h2>
                <p className="text-sm text-slate-500">{profile.designation} · {profile.department}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    ● Active
                  </span>
                  <span className="rounded-full bg-[#F5F3FC] px-3 py-1 text-xs font-semibold text-[#302568]">
                    {profile.employeeType}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {profile.id}
                  </span>
                </div>
              </div>

              {!editing ? (
                <button
                  type="button"
                  onClick={startEdit}
                  className="flex items-center gap-2 rounded-xl border border-[#E7E8F0] px-4 py-2 text-sm font-semibold text-slate-600 hover:border-[#302568]/30 hover:bg-[#F5F3FC] hover:text-[#302568] transition"
                >
                  <FiEdit2 className="text-xs" /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex items-center gap-1.5 rounded-xl border border-[#E7E8F0] px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-[#F6F7FB] transition"
                  >
                    <FiX className="text-xs" /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="flex items-center gap-1.5 rounded-xl bg-[#302568] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d3080] transition"
                  >
                    <FiSave className="text-xs" /> Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Personal Information ── */}
        <Section title="Personal Information" icon={FiUser}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Full Name</Label>
              <input value={field("name")} onChange={(e)=>setField("name",e.target.value)} disabled={!editing} className={inputCls} />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <input value={field("dob")} onChange={(e)=>setField("dob",e.target.value)} disabled={!editing} className={inputCls} />
            </div>
            <div>
              <Label>Gender</Label>
              {editing ? (
                <select value={draft.gender} onChange={(e)=>setField("gender",e.target.value)} className={inputCls}>
                  <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                </select>
              ) : (
                <input value={profile.gender} disabled className={inputCls} />
              )}
            </div>
            <div>
              <Label>Blood Group</Label>
              <input value={field("bloodGroup")} onChange={(e)=>setField("bloodGroup",e.target.value)} disabled={!editing} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <textarea
                rows={2}
                value={field("address")}
                onChange={(e)=>setField("address",e.target.value)}
                disabled={!editing}
                className={inputCls + " resize-none"}
              />
            </div>
          </div>
        </Section>

        {/* ── Contact Information ── */}
        <Section title="Contact Information" icon={FiMail}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Email Address</Label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input value={profile.email} disabled className={inputCls + " pl-10"} />
              </div>
              <p className="mt-1 text-xs text-slate-400">Contact HR to update your email</p>
            </div>
            <div>
              <Label>Phone Number</Label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  value={field("phone")}
                  onChange={(e)=>setField("phone",e.target.value)}
                  disabled={!editing}
                  className={inputCls + " pl-10"}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Employment Details ── */}
        <Section title="Employment Details" icon={FiBriefcase}>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Employee ID",    key: "id",           disabled: true  },
              { label: "Department",     key: "department",   disabled: true  },
              { label: "Designation",    key: "designation",  disabled: true  },
              { label: "Employee Type",  key: "employeeType", disabled: true  },
              { label: "Joining Date",   key: "joiningDate",  disabled: true  },
              { label: "Reporting To",   key: "reportingTo",  disabled: true  },
              { label: "Work Location",  key: "workLocation", disabled: false },
            ].map(({ label, key, disabled }) => (
              <div key={key}>
                <Label>{label}</Label>
                <input
                  value={disabled ? (profile[key] || "") : field(key)}
                  onChange={(e) => !disabled && setField(key, e.target.value)}
                  disabled={disabled || !editing}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
          {!editing && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <FiShield className="text-slate-300" /> Employment details can only be updated by HR
            </p>
          )}
        </Section>

        {/* ── Skills ── */}
        <Section title="Skills & Expertise" icon={FiGlobe}>
          <div className="flex flex-wrap gap-2">
            {(profile.skills || []).map((skill) => (
              <span
                key={skill}
                className="rounded-xl border border-[#E7E8F0] bg-[#F5F3FC] px-3 py-1.5 text-xs font-semibold text-[#302568]"
              >
                {skill}
              </span>
            ))}
            {(profile.skills || []).length === 0 && (
              <p className="text-sm text-slate-400">No skills added</p>
            )}
            {editing && (
              <p className="w-full mt-2 text-xs text-slate-400">Contact HR to update skills</p>
            )}
          </div>
        </Section>

        {/* ── Social / Links ── */}
        <Section title="Social Profiles" icon={FiLinkedin}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>LinkedIn</Label>
              <div className="relative">
                <FiLinkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  value={field("linkedin")}
                  onChange={(e)=>setField("linkedin",e.target.value)}
                  disabled={!editing}
                  placeholder="linkedin.com/in/username"
                  className={inputCls + " pl-10"}
                />
              </div>
            </div>
            <div>
              <Label>GitHub</Label>
              <div className="relative">
                <FiGithub className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  value={field("github")}
                  onChange={(e)=>setField("github",e.target.value)}
                  disabled={!editing}
                  placeholder="github.com/username"
                  className={inputCls + " pl-10"}
                />
              </div>
            </div>
            <div>
              <Label>Portfolio / Website</Label>
              <div className="relative">
                <FiGlobe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  value={field("portfolio")}
                  onChange={(e)=>setField("portfolio",e.target.value)}
                  disabled={!editing}
                  placeholder="yourportfolio.com"
                  className={inputCls + " pl-10"}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Emergency Contact ── */}
        <Section title="Emergency Contact" icon={FiPhone}>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Contact Name</Label>
              <input
                value={editing ? (draft.emergencyContact?.name || "") : (profile.emergencyContact?.name || "")}
                onChange={(e) => setDraft((p) => ({ ...p, emergencyContact: { ...p.emergencyContact, name: e.target.value } }))}
                disabled={!editing}
                className={inputCls}
              />
            </div>
            <div>
              <Label>Relation</Label>
              <input
                value={editing ? (draft.emergencyContact?.relation || "") : (profile.emergencyContact?.relation || "")}
                onChange={(e) => setDraft((p) => ({ ...p, emergencyContact: { ...p.emergencyContact, relation: e.target.value } }))}
                disabled={!editing}
                className={inputCls}
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <input
                value={editing ? (draft.emergencyContact?.phone || "") : (profile.emergencyContact?.phone || "")}
                onChange={(e) => setDraft((p) => ({ ...p, emergencyContact: { ...p.emergencyContact, phone: e.target.value } }))}
                disabled={!editing}
                className={inputCls}
              />
            </div>
          </div>
        </Section>

        {/* ── Change Password ── */}
        <Section title="Change Password" icon={FiLock}>
          <ChangePassword />
        </Section>

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </div>
  );
}
