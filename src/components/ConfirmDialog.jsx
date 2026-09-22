function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  // Escape cancels, like clicking outside the dialog.
  React.useEffect(() => {
    const onKeyDown = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="overlay" onClick={onCancel}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dialog-title">{title}</h2>
        <p id="dialog-message">{message}</p>
        <div className="actions">
          {/* Cancel gets focus first so a stray Enter can't destroy data. */}
          <button autoFocus onClick={onCancel}>Cancel</button>
          <button className="danger-solid" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
