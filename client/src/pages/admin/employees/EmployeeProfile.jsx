import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AttendanceCalendar from "../../../components/attendance/AttendanceCalendar";
import LeaveBalance from "../../../components/leaves/LeaveBalance";
import PageHeader from "../../../components/layout/PageHeader";
import Avatar from "../../../components/ui/Avatar";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Tabs from "../../../components/ui/Tabs";
import { getAttendanceByEmployee } from "../../../services/attendanceService";
import { getEmployees } from "../../../services/employeeService";
import { getLeaveBalance, getMyLeaves } from "../../../services/leaveService";
import formatCurrency from "../../../utils/formatCurrency";

const tabs = ["Overview", "Documents", "Attendance", "Leaves", "Payroll"];

function EmployeeProfile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Overview");
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);

  useEffect(() => {
    getEmployees().then((employees) => {
      const found = employees.find((item) => item._id === id) || employees[0];
      setEmployee(found);

      if (found) {
        // Load attendance and leaves for this employee
        getAttendanceByEmployee(found._id)
          .then(setAttendance)
          .catch(() => setAttendance([]));

        getMyLeaves(found._id)
          .then(setLeaves)
          .catch(() => setLeaves([]));

        getLeaveBalance(found._id)
          .then((balance) => {
            const getRemaining = (type) => {
              const item = balance?.[type] || { total: 0, used: 0 };
              return Math.max(Number(item.total || 0) - Number(item.used || 0), 0);
            };

            setLeaveBalance([
              {
                employee: found.name || found.email || found.employeeId || "Employee",
                casual: getRemaining("Casual Leave"),
                sick: getRemaining("Sick Leave"),
                earned: getRemaining("Earned Leave"),
              },
            ]);
          })
          .catch(() => setLeaveBalance([]));
      }
    });
  }, [id]);

  if (!employee) return null;

  const overviewItems = [
    ["Email", employee.email],
    ["Phone", employee.phone],
    ["DOB", employee.dob],
    ["Gender", employee.gender],
    ["Blood Group", employee.bloodGroup],
    ["Address", employee.address],
    ["Emergency Contact", employee.emergencyContact],
    ["Designation", employee.designation],
    ["Joining Date", employee.joiningDate],
    ["Salary", formatCurrency(employee.salary)],
    ["Role", employee.role],
    ["Bank", employee.bankName],
    ["Account", employee.accountNumber],
    ["IFSC", employee.ifsc],
    ["PAN", employee.panNumber],
  ];

  const documents = ["Aadhaar Card", "PAN Card", "Resume", "Offer Letter"];

  const salaryHistory = [
    {
      month: "May 2026",
      gross: employee.salary,
      deductions: 6000,
      net: Number(employee.salary || 0) - 6000,
    },
    {
      month: "Apr 2026",
      gross: employee.salary,
      deductions: 6000,
      net: Number(employee.salary || 0) - 6000,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Profile"
        subtitle="Personal, job, attendance, leave, and payroll details."
      />

      <Card>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={employee.name} className="h-20 w-20 text-xl" />
            <div>
              <h2 className="text-2xl font-bold text-slate-950">{employee.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {employee.employeeId || employee._id}
              </p>
              <div className="mt-3">
                <Badge variant="primary">{employee.department}</Badge>
              </div>
            </div>
          </div>
          <Button>Download Profile</Button>
        </div>
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "Overview" && (
        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            {overviewItems.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#E7E8F0] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {value || "-"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "Documents" && (
        <Card>
          <div className="grid gap-3">
            {documents.map((document) => (
              <div
                key={document}
                className="flex items-center justify-between rounded-xl border border-[#E7E8F0] px-4 py-3"
              >
                <span className="font-semibold text-slate-950">{document}</span>
                <Button className="px-4 py-2">Download</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "Attendance" && (
        <AttendanceCalendar records={attendance} />
      )}

      {activeTab === "Leaves" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <LeaveBalance balances={leaveBalance} />
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-950">
              Leave History
            </h2>
            {leaves.length === 0 ? (
              <p className="text-sm text-slate-400">No leave records found.</p>
            ) : (
              <div className="space-y-3">
                {leaves.map((leave) => (
                  <div
                    key={leave._id}
                    className="rounded-xl border border-[#E7E8F0] p-4"
                  >
                    <p className="font-semibold text-slate-950">{leave.leaveType}</p>
                    <p className="text-sm text-slate-500">
                      {leave.fromDate} - {leave.toDate}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "Payroll" && (
        <Card>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-3">Month</th>
                <th className="py-3">Gross</th>
                <th className="py-3">Deductions</th>
                <th className="py-3">Net</th>
                <th className="py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEEF5]">
              {salaryHistory.map((row) => (
                <tr key={row.month}>
                  <td className="py-3 font-semibold text-slate-950">{row.month}</td>
                  <td>{formatCurrency(row.gross)}</td>
                  <td>{formatCurrency(row.deductions)}</td>
                  <td>{formatCurrency(row.net)}</td>
                  <td>
                    <Button className="px-4 py-2">Download</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export default EmployeeProfile;
