import { useEffect, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import PageHeader from "../../../components/layout/PageHeader";
import Avatar from "../../../components/ui/Avatar";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Table from "../../../components/ui/Table";
import { getMyActivity } from "../../../services/activityService";
import getStoredUser from "../../../utils/authStorage";

function PasswordInput({ label }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          className="w-full rounded-xl border border-[#E0E3EC] bg-white px-3.5 py-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10"
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-[#F5F3FC] hover:text-[#302568]"
        >
          {visible ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  );
}

function Profile() {
  const user = getStoredUser();
  const [loginHistory, setLoginHistory] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        const data = await getMyActivity(user?.id || user?.userId);
        setLoginHistory(data.loginHistory || []);
        setActivities(data.activities || []);
      } catch {
        setLoginHistory([]);
        setActivities([]);
      }
    };
    loadActivity();
  }, [user?.id, user?.userId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Profile"
        subtitle="Manage profile information, password, login history, and activity."
      />

      <Card>
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <Avatar name="Admin User" className="h-20 w-20 text-xl" />
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              Admin User
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              admin@appsitelabs.com
            </p>
            <p className="mt-1 text-sm font-semibold text-[#5B3FD6]">
              Super Admin
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Input label="Name" defaultValue="Admin User" />
          <Input label="Phone" defaultValue="9876543210" />
          <Input label="Email" defaultValue="admin@appsitelabs.com" />
          <Input label="Role" defaultValue="Super Admin" />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-950">
          Change Password
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <PasswordInput label="Current Password" />
          <PasswordInput label="New Password" />
          <PasswordInput label="Confirm Password" />
        </div>
        <div className="mt-5">
          <Button>Update Password</Button>
        </div>
      </Card>

      <Table
        columns={["Date", "IP", "Device"]}
        data={loginHistory}
        renderRow={(item) => (
          <tr key={`${item.date}-${item.ip}`}>
            <td className="px-4 py-4">{item.date}</td>
            <td className="px-4 py-4">{item.ip}</td>
            <td className="px-4 py-4">{item.device}</td>
          </tr>
        )}
      />

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-950">
          Activity Log
        </h2>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id || activity.action}
              className="rounded-xl border border-[#E7E8F0] px-4 py-3 text-sm font-semibold text-slate-700"
            >
              {activity.action || activity}
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-sm text-slate-400">No activity recorded yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

export default Profile;
