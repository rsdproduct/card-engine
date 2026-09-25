"use client";

/** Shared confirm for resetting feed + Studio + Card Index together. */
export function ResetDemoDialog({
  open,
  onCancel,
  onConfirm,
  confirmTestId = "reset-demo-confirm-yes",
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmTestId?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4"
      role="alertdialog"
      aria-labelledby="reset-demo-title"
      aria-describedby="reset-demo-desc"
      data-testid="reset-demo-confirm"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3
          id="reset-demo-title"
          className="text-lg font-semibold text-slate-900"
        >
          Reset the whole demo?
        </h3>
        <p id="reset-demo-desc" className="mt-2 text-sm text-slate-600">
          This clears feed changes, Studio cards, and Card Index edits, and puts
          the sample data back. You cannot undo.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            data-testid={confirmTestId}
          >
            Reset demo
          </button>
        </div>
      </div>
    </div>
  );
}
