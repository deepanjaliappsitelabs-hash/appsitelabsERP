import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import EmployeeLayout from "../layouts/EmployeeLayout";
import Attendance from "../pages/admin/Attendance";
import Dashboard from "../pages/admin/Dashboard";
import Employees from "../pages/admin/Employees";
import Leaves from "../pages/admin/Leaves";
import Signup from "../pages/admin/Signup";
import Documents from "../pages/admin/documents/Documents";
import AddEmployee from "../pages/admin/employees/AddEmployee";
import EmployeeProfile from "../pages/admin/employees/EmployeeProfile";
import Contacts from "../pages/admin/general/Contacts";
import GeneralDashboard from "../pages/admin/general/GeneralDashboard";
import Payroll from "../pages/admin/payroll/Payroll";
import PayslipView from "../pages/admin/payroll/PayslipView";
import ProjectContacts from "../pages/admin/projects/ProjectContacts";
import ProjectDetail from "../pages/admin/projects/ProjectDetail";
import Projects from "../pages/admin/projects/Projects";
import CandidateDetail from "../pages/admin/recruitment/CandidateDetail";
import CandidateList from "../pages/admin/recruitment/CandidateList";
import Jobs from "../pages/admin/recruitment/Jobs";
import Recruitment from "../pages/admin/recruitment/Recruitment";
import Reports from "../pages/admin/reports/Reports";
import Profile from "../pages/admin/settings/Profile";
import Settings from "../pages/admin/settings/Settings";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Login from "../pages/auth/Login";
import ProtectedRoute from "../components/shared/ProtectedRoute";
import RoleRoute from "../components/shared/RoleRoute";

// ── Apps ──────────────────────────────────────────────────────────────────────
import CalendarPage from "../pages/admin/apps/CalendarPage";
import { EmailInbox, EmailCompose, EmailPreview } from "../pages/admin/apps/Email";
import { ChatInbox, ChatPreview } from "../pages/admin/apps/Chat";
import { TaskList, TaskKanban } from "../pages/admin/apps/Tasks";

// ── Firebase Invoice (replaced old Invoice app) ───────────────────────────────
import ManageInvoices from "../pages/admin/invoice/ManageInvoices";
import InvoicePage    from "../pages/admin/invoice/InvoicePage";

// ── Admin Notifications ───────────────────────────────────────────────────────
import NotificationsPage from "../pages/admin/NotificationsPage";

// ── Employee pages ────────────────────────────────────────────────────────────
import EmployeeDashboard   from "../pages/employee/Dashboard";
import EmployeeAttendance  from "../pages/employee/Attendance";
import EmployeeLeaves      from "../pages/employee/Leaves";
import DailyWorkLog        from "../pages/employee/DailyWorkLog";
import EmployeePayslips    from "../pages/employee/Payslips";
import EmployeeDocuments   from "../pages/employee/Documents";
import EmployeeNotices     from "../pages/employee/Notices";
import EmployeeProfilePage from "../pages/employee/Profile";

// ─────────────────────────────────────────────────────────────────────────────

const hostname  = window.location.hostname;
const subdomain = hostname.split(".")[0];
const isAdmin    = subdomain === "admin";
const isEmployee = subdomain === "erp";

// ─────────────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Auth ── */}
        <Route path="/"                element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ════════════════════════════════════════════════════
            ADMIN — admin.appsitelabs.com
        ════════════════════════════════════════════════════ */}
        {isAdmin && (
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleRoute role="admin">
                  <AdminLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"            element={<Dashboard />} />
            <Route path="employees"            element={<Employees />} />
            <Route path="employees/add"        element={<AddEmployee />} />
            <Route path="employees/:id"        element={<EmployeeProfile />} />
            <Route path="signup"               element={<Signup />} />
            <Route path="attendance"           element={<Attendance />} />
            <Route path="leaves"               element={<Leaves />} />
            <Route path="payroll"              element={<Payroll />} />
            <Route path="payroll/payslip/:id"  element={<PayslipView />} />
            <Route path="reports"              element={<Reports />} />
            <Route path="documents"            element={<Documents />} />
            <Route path="recruitment"                element={<Recruitment />} />
            <Route path="recruitment/jobs"           element={<Jobs />} />
            <Route path="recruitment/candidates"     element={<CandidateList />} />
            <Route path="recruitment/candidates/:id" element={<CandidateDetail />} />
            <Route path="projects"         element={<Projects />} />
            <Route path="projects/:id"     element={<ProjectDetail />} />
            <Route path="project-contacts" element={<ProjectContacts />} />
            <Route path="general"          element={<GeneralDashboard />} />
            <Route path="contacts"         element={<Contacts />} />
            <Route path="profile"          element={<Profile />} />
            <Route path="settings"         element={<Settings />} />
            <Route path="notifications"    element={<NotificationsPage />} />
            <Route path="calendar"         element={<CalendarPage />} />
            <Route path="email/inbox"      element={<EmailInbox />} />
            <Route path="email/compose"    element={<EmailCompose />} />
            <Route path="email/preview"    element={<EmailPreview />} />
            <Route path="chat/inbox"       element={<ChatInbox />} />
            <Route path="chat/preview"     element={<ChatPreview />} />
            <Route path="tasks"            element={<TaskList />} />
            <Route path="tasks/kanban"     element={<TaskKanban />} />
            {/* ── Firebase Invoices ── */}
            <Route path="invoices"          element={<ManageInvoices />} />
            <Route path="invoices/new"      element={<InvoicePage adminMode />} />
            <Route path="invoices/:id/view" element={<InvoicePage adminMode viewMode />} />
            <Route path="invoices/:id/edit" element={<InvoicePage adminMode />} />
          </Route>
        )}

        {/* ════════════════════════════════════════════════════
            EMPLOYEE — erp.appsitelabs.com
        ════════════════════════════════════════════════════ */}
        {isEmployee && (
          <Route
            path="/employee"
            element={
              <ProtectedRoute>
                <RoleRoute role="employee">
                  <EmployeeLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route index        element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"  element={<EmployeeDashboard />} />
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="leaves"     element={<EmployeeLeaves />} />
            <Route path="work-log"   element={<DailyWorkLog />} />
            <Route path="payslips"   element={<EmployeePayslips />} />
            <Route path="documents"  element={<EmployeeDocuments />} />
            <Route path="notices"    element={<EmployeeNotices />} />
            <Route path="email/inbox" element={<EmailInbox />} />
            <Route path="email/compose" element={<EmailCompose />} />
            <Route path="email/preview" element={<EmailPreview />} />
            <Route path="chat/inbox" element={<ChatInbox />} />
            <Route path="chat/preview" element={<ChatPreview />} />
            <Route path="profile"    element={<EmployeeProfilePage />} />
          </Route>
        )}

        {/* ════════════════════════════════════════════════════
            LOCALHOST / DEV MODE
        ════════════════════════════════════════════════════ */}
        {!isAdmin && !isEmployee && (
          <>
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleRoute role="admin">
                    <AdminLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"            element={<Dashboard />} />
              <Route path="employees"            element={<Employees />} />
              <Route path="employees/add"        element={<AddEmployee />} />
              <Route path="employees/:id"        element={<EmployeeProfile />} />
              <Route path="signup"               element={<Signup />} />
              <Route path="attendance"           element={<Attendance />} />
              <Route path="leaves"               element={<Leaves />} />
              <Route path="payroll"              element={<Payroll />} />
              <Route path="payroll/payslip/:id"  element={<PayslipView />} />
              <Route path="reports"              element={<Reports />} />
              <Route path="documents"            element={<Documents />} />
              <Route path="recruitment"                element={<Recruitment />} />
              <Route path="recruitment/jobs"           element={<Jobs />} />
              <Route path="recruitment/candidates"     element={<CandidateList />} />
              <Route path="recruitment/candidates/:id" element={<CandidateDetail />} />
              <Route path="projects"         element={<Projects />} />
              <Route path="projects/:id"     element={<ProjectDetail />} />
              <Route path="project-contacts" element={<ProjectContacts />} />
              <Route path="general"          element={<GeneralDashboard />} />
              <Route path="contacts"         element={<Contacts />} />
              <Route path="profile"          element={<Profile />} />
              <Route path="settings"         element={<Settings />} />
              <Route path="notifications"    element={<NotificationsPage />} />
              <Route path="calendar"         element={<CalendarPage />} />
              <Route path="email/inbox"      element={<EmailInbox />} />
              <Route path="email/compose"    element={<EmailCompose />} />
              <Route path="email/preview"    element={<EmailPreview />} />
              <Route path="chat/inbox"       element={<ChatInbox />} />
              <Route path="chat/preview"     element={<ChatPreview />} />
              <Route path="tasks"            element={<TaskList />} />
              <Route path="tasks/kanban"     element={<TaskKanban />} />
              {/* ── Firebase Invoices ── */}
              <Route path="invoices"          element={<ManageInvoices />} />
              <Route path="invoices/new"      element={<InvoicePage adminMode />} />
              <Route path="invoices/:id/view" element={<InvoicePage adminMode viewMode />} />
              <Route path="invoices/:id/edit" element={<InvoicePage adminMode />} />
            </Route>

            <Route
              path="/employee"
              element={
                <ProtectedRoute>
                  <RoleRoute role="employee">
                    <EmployeeLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index        element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"  element={<EmployeeDashboard />} />
              <Route path="attendance" element={<EmployeeAttendance />} />
              <Route path="leaves"     element={<EmployeeLeaves />} />
              <Route path="work-log"   element={<DailyWorkLog />} />
              <Route path="payslips"   element={<EmployeePayslips />} />
              <Route path="documents"  element={<EmployeeDocuments />} />
              <Route path="notices"    element={<EmployeeNotices />} />
              <Route path="email/inbox" element={<EmailInbox />} />
              <Route path="email/compose" element={<EmailCompose />} />
              <Route path="email/preview" element={<EmailPreview />} />
              <Route path="chat/inbox" element={<ChatInbox />} />
              <Route path="chat/preview" element={<ChatPreview />} />
              <Route path="profile"    element={<EmployeeProfilePage />} />
            </Route>
          </>
        )}

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
