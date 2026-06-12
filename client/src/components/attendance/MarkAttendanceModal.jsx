import { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

const initialState = {
  employeeName: "",
  employee_id: "",
  department: "",
  date: new Date().toISOString().slice(0, 10),
  checkIn: "09:30",
  checkInPeriod: "AM",
  checkOut: "18:00",
  checkOutPeriod: "PM",
  hours: "8h 30m",
  status: "Present",
  lateNote: "",
};

const to12HourTime = (time) => {
  const [hour = "12", minute = "00"] = String(time || "12:00").split(":");
  const hourNumber = Number(hour);
  const period = hourNumber >= 12 ? "PM" : "AM";
  const displayHour = hourNumber % 12 || 12;
  return {
    time: `${String(displayHour).padStart(2, "0")}:${minute}`,
    period,
  };
};

const to24HourTime = (time, period) => {
  const [hour = "12", minute = "00"] = String(time || "12:00").split(":");
  let hourNumber = Number(hour);

  if (period === "PM" && hourNumber < 12) hourNumber += 12;
  if (period === "AM" && hourNumber === 12) hourNumber = 0;

  return `${String(hourNumber).padStart(2, "0")}:${minute}`;
};

function TimeWithPeriod({ label, name, periodName, value, period, onChange }) {
  const display = to12HourTime(value);

  const handleTimeChange = (event) => {
    onChange({
      target: {
        name,
        value: to24HourTime(event.target.value, period || display.period),
      },
    });
  };

  const handlePeriodChange = (event) => {
    const nextPeriod = event.target.value;
    onChange({
      target: {
        name: periodName,
        value: nextPeriod,
      },
    });
    onChange({
      target: {
        name,
        value: to24HourTime(display.time, nextPeriod),
      },
    });
  };

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <div className="grid grid-cols-[1fr_92px] gap-2">
        <input
          type="time"
          value={display.time}
          onChange={handleTimeChange}
          className="w-full rounded-xl border border-[#E0E3EC] bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10"
        />
        <select
          value={period || display.period}
          onChange={handlePeriodChange}
          className="rounded-xl border border-[#E0E3EC] bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </label>
  );
}

function MarkAttendanceModal({
  open,
  onClose,
  onSubmit,
  employees = [],
}) {
  const [formData, setFormData] = useState(initialState);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    const selectedEmployee =
      name === "employeeName"
        ? employees.find((employee) => employee.name === value)
        : null;

    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(selectedEmployee
        ? { department: selectedEmployee.department, employee_id: selectedEmployee.id || selectedEmployee._id }
        : {}),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
    setFormData(initialState);
  };

  return (
    <Modal
      title="Mark Attendance"
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 md:grid-cols-2"
      >
        <Select
          label="Employee"
          name="employeeName"
          value={formData.employeeName}
          onChange={handleChange}
          options={[
            { value: "", label: "Select employee" },
            ...employees.map((employee) => ({
              value: employee.name,
              label: employee.name,
            })),
          ]}
        />
        <Input
          label="Department"
          name="department"
          value={formData.department}
          onChange={handleChange}
        />
        <Input
          label="Date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
        />
        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={["Present", "Late", "Absent", "On Leave", "WFH"]}
        />
        <TimeWithPeriod
          label="Check-in"
          name="checkIn"
          periodName="checkInPeriod"
          value={formData.checkIn}
          period={formData.checkInPeriod}
          onChange={handleChange}
        />
        <TimeWithPeriod
          label="Check-out"
          name="checkOut"
          value={formData.checkOut}
          periodName="checkOutPeriod"
          period={formData.checkOutPeriod}
          onChange={handleChange}
        />
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Late login note
          </span>
          <textarea
            name="lateNote"
            value={formData.lateNote}
            onChange={handleChange}
            rows={3}
            maxLength={300}
            placeholder="Add a reason or note for this attendance record"
            className="w-full resize-none rounded-xl border border-[#E0E3EC] bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10"
          />
        </label>
        <div className="flex justify-end gap-3 md:col-span-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E0E3EC] px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F9FC]"
          >
            Cancel
          </button>
          <Button type="submit">
            Save Attendance
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default MarkAttendanceModal;
