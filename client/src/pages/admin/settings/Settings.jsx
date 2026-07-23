import { useState } from "react";
import PageHeader from "../../../components/layout/PageHeader";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import FileUpload from "../../../components/ui/FileUpload";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Tabs from "../../../components/ui/Tabs";

const tabs = [
  "Company",
  "Email/SMTP",
  "Shifts",
  "Leave Policy",
  "Departments",
  "Roles & Permissions",
  "Branches",
];

const permissions = [
  "View",
  "Edit",
  "Delete",
  "Export",
  "Approve",
];

function Settings() {
  const [activeTab, setActiveTab] = useState("Company");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configure company, roles, permissions, shifts, leave rules, and branches."
        action={<Button>Save Changes</Button>}
      />

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "Company" && (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Company Name" defaultValue="AppsiteLabs" />
            <Input label="GST" placeholder="GST number" />
            <Input label="CIN" placeholder="CIN number" />
            <Select label="Timezone" options={["Asia/Kolkata", "UTC", "Asia/Dubai"]} />
            <Select label="Currency" options={["INR", "USD", "AED"]} />
            <Input label="Address" placeholder="Company address" />
            <div className="md:col-span-2">
              <FileUpload label="Upload Company Logo" />
            </div>
          </div>
        </Card>
      )}

      {activeTab === "Email/SMTP" && (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="SMTP Host" placeholder="smtp.example.com" />
            <Input label="SMTP Port" placeholder="587" />
            <Input label="Username" />
            <Input label="Password" type="password" />
          </div>
        </Card>
      )}

      {activeTab === "Shifts" && (
        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Shift Name" defaultValue="General" />
            <Input label="Start Time" type="time" defaultValue="09:30" />
            <Input label="End Time" type="time" defaultValue="18:30" />
          </div>
        </Card>
      )}

      {activeTab === "Leave Policy" && (
        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Casual Leaves" type="number" defaultValue="12" />
            <Input label="Sick Leaves" type="number" defaultValue="8" />
            <Input label="Earned Leaves" type="number" defaultValue="15" />
          </div>
        </Card>
      )}

      {activeTab === "Departments" && (
        <Card>
          <div className="grid gap-3 md:grid-cols-3">
            {["Development", "Design", "HR", "Marketing", "Operations"].map((department) => (
              <div key={department} className="rounded-xl border border-[#E7E8F0] p-4 font-semibold text-slate-950">
                {department}
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "Roles & Permissions" && (
        <Card>
          <div className="space-y-4">
            {["Admin", "HR", "Manager", "Employee"].map((role) => (
              <div
                key={role}
                className="rounded-xl border border-[#E7E8F0] p-4"
              >
                <p className="mb-3 font-semibold text-slate-950">{role}</p>
                <div className="flex flex-wrap gap-4">
                  {permissions.map((permission) => (
                    <label key={permission} className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" defaultChecked={role === "Admin"} />
                      {permission}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "Branches" && (
        <Card>
          <div className="grid gap-3 md:grid-cols-3">
            {["Pune HQ", "Hyderabad", "Remote"].map((branch) => (
              <div key={branch} className="rounded-xl border border-[#E7E8F0] p-4 font-semibold text-slate-950">
                {branch}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default Settings;
