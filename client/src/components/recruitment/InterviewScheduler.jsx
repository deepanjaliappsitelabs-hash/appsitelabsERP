import { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";

function InterviewScheduler({
  open,
  candidate,
  onClose,
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: "11:00",
    interviewer: "",
    mode: "Google Meet",
  });

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.({
      ...formData,
      candidateId: candidate?._id,
      candidateName: candidate?.name,
    });
  };

  return (
    <Modal
      title={`Schedule Interview${candidate ? `: ${candidate.name}` : ""}`}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 md:grid-cols-2"
      >
        <Input
          label="Date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
        />
        <Input
          label="Time"
          name="time"
          type="time"
          value={formData.time}
          onChange={handleChange}
        />
        <Input
          label="Interviewer"
          name="interviewer"
          value={formData.interviewer}
          onChange={handleChange}
        />
        <Input
          label="Mode"
          name="mode"
          value={formData.mode}
          onChange={handleChange}
        />
        <div className="flex justify-end gap-3 md:col-span-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E0E3EC] px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F9FC]"
          >
            Cancel
          </button>
          <Button type="submit">
            Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default InterviewScheduler;
