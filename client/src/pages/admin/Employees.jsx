import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmployeeFilters from "../../components/employee/EmployeeFilters";
import EmployeeModal from "../../components/employee/EmployeeModal";
import EmployeeStats from "../../components/employee/EmployeeStats";
import EmployeeTable from "../../components/employee/EmployeeTable";
import {
  deleteEmployee as deleteEmployeeAPI,
  getEmployees,
  updateEmployee,
} from "../../services/employeeService";

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
  employeeId: "",
  joiningDate: "",
  salary: "",
  role: "Employee",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  panNumber: "",
  documents: {},
  photo: "",
};

const parseDocuments = (documents) => {
  if (!documents) return {};
  if (typeof documents === "object") return documents;
  try {
    return JSON.parse(documents);
  } catch {
    return {};
  }
};

function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees]           = useState([]);
  const [formData, setFormData]             = useState(initialFormData);
  const [editId, setEditId]                 = useState(null);
  const [showModal, setShowModal]           = useState(false);
  const [search, setSearch]                 = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [pendingDelete, setPendingDelete]   = useState(null);
  const [loading, setLoading]               = useState(true);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      toast.error("Employees could not be loaded: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(
    () =>
      employees.filter((emp) => {
        const query = search.toLowerCase();
        const matchesSearch =
          emp.name?.toLowerCase().includes(query) ||
          emp.email?.toLowerCase().includes(query);
        const matchesDepartment =
          !departmentFilter || emp.department === departmentFilter;
        const matchesDesignation =
          !designationFilter || emp.designation === designationFilter;
        return matchesSearch && matchesDepartment && matchesDesignation;
      }),
    [employees, search, departmentFilter, designationFilter]
  );

  const designationOptions = useMemo(
    () =>
      [...new Set(employees.map((emp) => emp.designation).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [employees]
  );

  const handleEdit = (employee) => {
    setFormData({
      name:             employee.name || "",
      email:            employee.email || "",
      phone:            employee.phone || "",
      dob:              employee.dob ? employee.dob.slice(0, 10) : "",
      gender:           employee.gender || "",
      bloodGroup:       employee.bloodGroup || "",
      address:          employee.address || "",
      emergencyContact: employee.emergencyContact || "",
      department:       employee.department || "",
      designation:      employee.designation || "",
      employeeId:       employee.employeeId || "",
      joiningDate:      employee.joiningDate ? employee.joiningDate.slice(0, 10) : "",
      salary:           employee.salary || "",
      role:             employee.role || "Employee",
      bankName:         employee.bankName || "",
      accountNumber:    employee.accountNumber || "",
      ifsc:             employee.ifsc || "",
      panNumber:        employee.panNumber || "",
      documents:        parseDocuments(employee.documents),
      photo:            employee.photo || "",
    });
    // _id is already normalized in employeeService.
    setEditId(employee._id);
    setShowModal(true);
  };

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setFormData((prev) => ({ ...prev, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [e.target.name]: file.name,
      },
    }));
    e.target.value = "";
  };

  const handleDocumentClear = (name) => {
    setFormData((prev) => {
      const nextDocuments = { ...(prev.documents || {}) };
      delete nextDocuments[name];
      return {
        ...prev,
        documents: nextDocuments,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateEmployee(editId, formData);
      toast.success("Employee updated");
      setShowModal(false);
      setEditId(null);
      fetchEmployees();
    } catch (err) {
      toast.error("Update failed: " + (err.response?.data?.message || err.message));
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteEmployeeAPI(pendingDelete._id);
      setEmployees((cur) => cur.filter((emp) => emp._id !== pendingDelete._id));
      toast.success("Employee deleted");
    } catch (err) {
      toast.error("Delete failed: " + (err.response?.data?.message || err.message));
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        subtitle="Manage employee records, departments, salary details, and workforce status."
        action={
          <Button onClick={() => navigate("/admin/employees/add")}>
            Add Employee
          </Button>
        }
      />

      <EmployeeStats employees={employees} />

      <EmployeeFilters
        search={search}
        setSearch={setSearch}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        designationFilter={designationFilter}
        setDesignationFilter={setDesignationFilter}
        designationOptions={designationOptions}
      />

      {loading ? (
        <p className="text-center text-slate-400 py-10">Loading employees…</p>
      ) : (
        <EmployeeTable
          employees={filteredEmployees}
          onAdd={() => navigate("/admin/employees/add")}
          handleEdit={handleEdit}
          deleteEmployee={(id) =>
            setPendingDelete(employees.find((emp) => emp._id === id))
          }
        />
      )}

      <EmployeeModal
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        onPhotoChange={handlePhotoChange}
        onDocumentChange={handleDocumentChange}
        onDocumentClear={handleDocumentClear}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete employee"
        message={`Delete ${pendingDelete?.name || "this employee"}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default Employees;
