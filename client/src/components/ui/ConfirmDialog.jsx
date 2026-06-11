import Button from "./Button";
import Modal from "./Modal";

function ConfirmDialog({
  open,
  title = "Confirm action",
  message = "Are you sure you want to continue?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) {
    return null;
  }

  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#E0E3EC] px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F9FC]"
          >
            {cancelLabel}
          </button>
          <Button
            type="button"
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-6 text-slate-600">
        {message}
      </p>
    </Modal>
  );
}

export default ConfirmDialog;
