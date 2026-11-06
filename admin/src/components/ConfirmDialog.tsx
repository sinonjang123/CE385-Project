import { useEffect, useRef } from "react";

/**
 * Small confirmation dialog. Focus starts on the cancel button so Enter/Escape never confirms by accident.
 * Clicking the backdrop or pressing Escape cancels.
 */
export default function ConfirmDialog({ title, message, confirmLabel, cancelLabel = "ยกเลิก", onConfirm, onCancel }: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Return focus to whatever opened the dialog (e.g. the sign-out button) when it closes.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => opener?.focus();
  }, []);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button ref={cancelRef} type="button" className="button button-outline" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className="button button-dark" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
