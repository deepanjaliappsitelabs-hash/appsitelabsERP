import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiTrendingUp, FiUsers } from "react-icons/fi";
import RevenueChart from "../../../components/dashboard/RevenueChart";
import PageHeader from "../../../components/layout/PageHeader";
import Card from "../../../components/ui/Card";
import StatsCard from "../../../components/ui/StatsCard";
import { getContacts } from "../../../services/projectService";

function GeneralDashboard() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    getContacts().then(setContacts);
  }, []);

  const quickLinks = [
    {
      label: "Contacts",
      to: "/admin/contacts",
    },
    {
      label: "Reports",
      to: "/admin/reports",
    },
    {
      label: "Settings",
      to: "/admin/settings",
    },
    {
      label: "Profile",
      to: "/admin/profile",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="General Dashboard"
        subtitle="Company-level contacts, revenue, growth, and module shortcuts."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatsCard title="Contacts" value={contacts.length} icon={<FiUsers />} />
        <StatsCard title="Revenue" value="31L" icon={<FiTrendingUp />} />
        <StatsCard title="Growth" value="+14%" icon={<FiTrendingUp />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-950">
            Department Performance
          </h2>
          <div className="space-y-4">
            {[
              ["Development", 86],
              ["Design", 74],
              ["HR", 91],
              ["Marketing", 68],
            ].map(([department, value]) => (
              <div key={department}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-600">{department}</span>
                  <span className="font-semibold text-slate-950">{value}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#EEF0F6]">
                  <div
                    className="h-2 rounded-full bg-[#5B3FD6]"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-950">
          Quick Links
        </h2>
        <div className="grid gap-3 md:grid-cols-4">
          {quickLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => navigate(link.to)}
              className="rounded-xl border border-[#E7E8F0] px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-[#CFC6FF] hover:bg-[#F1EDFF] hover:text-[#5B3FD6]"
            >
              {link.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default GeneralDashboard;
