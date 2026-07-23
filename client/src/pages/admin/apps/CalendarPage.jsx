import { useState } from "react";
import PageHeader from "../../../components/layout/PageHeader";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const EVENT_COLORS = {
  Meeting:   "bg-blue-100 text-blue-700",
  Holiday:   "bg-green-100 text-green-700",
  Interview: "bg-purple-100 text-purple-700",
  Deadline:  "bg-red-100 text-red-700",
  Other:     "bg-yellow-100 text-yellow-700",
};

const defaultEvents = [
  { id: 1, title: "Team Standup",       date: "2026-05-04", type: "Meeting" },
  { id: 2, title: "React Interview",    date: "2026-05-07", type: "Interview" },
  { id: 3, title: "Project Deadline",   date: "2026-05-15", type: "Deadline" },
  { id: 4, title: "Eid Holiday",        date: "2026-05-20", type: "Holiday" },
  { id: 5, title: "HR Review Meeting",  date: "2026-05-22", type: "Meeting" },
  { id: 6, title: "Payroll Deadline",   date: "2026-05-28", type: "Deadline" },
];

const emptyEvent = { title: "", date: "", type: "Meeting" };

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [currentYear,  setYear]  = useState(today.getFullYear());
  const [currentMonth, setMonth] = useState(today.getMonth());
  const [events,       setEvents] = useState(defaultEvents);
  const [showModal,    setShowModal] = useState(false);
  const [setSelectedDate] = useState(null);
  const [formData,     setFormData] = useState(emptyEvent);
  const [editingId,    setEditingId] = useState(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay    = getFirstDay(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const dateStr = (day) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const eventsOn = (day) =>
    events.filter(e => e.date === dateStr(day));

  const openAdd = (day) => {
    setEditingId(null);
    setFormData({ ...emptyEvent, date: dateStr(day) });
    setSelectedDate(day);
    setShowModal(true);
  };

  const openEdit = (e, ev) => {
    e.stopPropagation();
    setEditingId(ev.id);
    setFormData({ title: ev.title, date: ev.date, type: ev.type });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.date) return;
    if (editingId) {
      setEvents(prev => prev.map(e => e.id === editingId ? { ...e, ...formData } : e));
    } else {
      setEvents(prev => [...prev, { ...formData, id: Date.now() }]);
    }
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyEvent);
  };

  const deleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setShowModal(false);
  };

  // Upcoming events (next 30 days)
  const todayStr = today.toISOString().split("T")[0];
  const upcoming = [...events]
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="View and manage events, holidays, and interviews."
        action={
          <Button onClick={() => { setFormData(emptyEvent); setEditingId(null); setShowModal(true); }}>
            + Add Event
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        {/* ── Calendar Grid ── */}
        <Card>
          {/* Month navigation */}
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg border border-[#E0E3EC] px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-[#F1EDFF]"
            >
              ‹ Prev
            </button>
            <h2 className="text-lg font-bold text-slate-900">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg border border-[#E0E3EC] px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-[#F1EDFF]"
            >
              Next ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-bold uppercase text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px]" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();
              const dayEvents = eventsOn(day);

              return (
                <div
                  key={day}
                  onClick={() => openAdd(day)}
                  className={`min-h-[80px] cursor-pointer rounded-xl border p-2 transition hover:border-[#CFC6FF] hover:bg-[#FAFAFF] ${
                    isToday
                      ? "border-[#5B3FD6] bg-[#F1EDFF]"
                      : "border-[#E7E8F0] bg-white"
                  }`}
                >
                  <span className={`text-xs font-bold ${isToday ? "text-[#5B3FD6]" : "text-slate-700"}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={(e) => openEdit(e, ev)}
                        className={`truncate rounded px-1 py-0.5 text-[10px] font-semibold cursor-pointer ${EVENT_COLORS[ev.type] || EVENT_COLORS.Other}`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Upcoming Events Sidebar ── */}
        <div className="space-y-4">
          <Card>
            <h3 className="mb-4 text-sm font-bold text-slate-900">Upcoming Events</h3>
            {upcoming.length === 0 && (
              <p className="text-sm text-slate-400">No upcoming events.</p>
            )}
            <div className="space-y-3">
              {upcoming.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 rounded-xl border border-[#E7E8F0] p-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F1EDFF] text-base">
                    {ev.type === "Meeting" ? "📅" : ev.type === "Holiday" ? "🎉" : ev.type === "Interview" ? "👤" : ev.type === "Deadline" ? "⏰" : "📌"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{ev.title}</p>
                    <p className="text-xs text-slate-400">{ev.date}</p>
                    <Badge variant="primary" className="mt-1 text-[10px]">{ev.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Legend */}
          <Card>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Legend</h3>
            <div className="space-y-2">
              {Object.entries(EVENT_COLORS).map(([type, cls]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>{type}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <Modal
          title={editingId ? "Edit Event" : "Add Event"}
          onClose={() => { setShowModal(false); setEditingId(null); setFormData(emptyEvent); }}
        >
          <div className="grid gap-4">
            <Input
              label="Event Title"
              value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Team Meeting"
            />
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
            />
            <Select
              label="Type"
              value={formData.type}
              onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
              options={["Meeting", "Holiday", "Interview", "Deadline", "Other"]}
            />
            <div className="flex justify-between gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={() => deleteEvent(editingId)}
                  className="rounded-xl bg-[#FEF3F2] px-4 py-2 text-sm font-semibold text-[#B42318]"
                >
                  Delete
                </button>
              )}
              <div className="ml-auto flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormData(emptyEvent); }}
                  className="rounded-xl border border-[#E0E3EC] px-5 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <Button onClick={handleSave}>
                  {editingId ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}