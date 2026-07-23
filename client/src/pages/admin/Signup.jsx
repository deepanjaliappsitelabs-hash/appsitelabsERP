import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

function Signup() {
  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
      role: "employee",
    });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post(
        "/auth/signup",
        formData
      );

      toast.success(
        "User signed up successfully"
      );

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "employee",
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Signup failed"
      );
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-950">
        Signup
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid max-w-2xl grid-cols-2 gap-4 rounded-2xl border border-[#E7E8F0] bg-white p-6 shadow-[0_14px_40px_rgba(17,24,39,0.05)]"
      >
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          className="rounded-xl border border-[#E0E3EC] p-3 text-sm outline-none transition focus:border-[#5B3FD6] focus:ring-4 focus:ring-[#5B3FD6]/10"
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          className="rounded-xl border border-[#E0E3EC] p-3 text-sm outline-none transition focus:border-[#5B3FD6] focus:ring-4 focus:ring-[#5B3FD6]/10"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          className="rounded-xl border border-[#E0E3EC] p-3 text-sm outline-none transition focus:border-[#5B3FD6] focus:ring-4 focus:ring-[#5B3FD6]/10"
          onChange={handleChange}
        />

        <select
          name="role"
          value={formData.role}
          className="rounded-xl border border-[#E0E3EC] p-3 text-sm outline-none transition focus:border-[#5B3FD6] focus:ring-4 focus:ring-[#5B3FD6]/10"
          onChange={handleChange}
        >
          <option value="employee">
            Employee
          </option>
          <option value="admin">
            Admin
          </option>
        </select>

        <button className="col-span-2 rounded-xl bg-[#5B3FD6] py-3 text-sm font-semibold text-white shadow-sm shadow-[#5B3FD6]/20 transition hover:bg-[#4B32BD]">
          Create Account
        </button>
      </form>
    </div>
  );
}

export default Signup;
