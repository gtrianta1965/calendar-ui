// The small menu that opens on a right click on an entry (in the day grid or the pivot): "Duplicate", and, on a forecast,
// "Duplicate as Actual". It sits at the mouse position (`x`, `y`, in viewport pixels), moved back inside the window when it
// would stick out, and closes on a click anywhere else (a right click too), on Escape, on a scroll or resize, and when
// the window loses focus - `onClose()`.
// `canDuplicate` false greys "Duplicate" out, with `hint` as its tooltip saying why; `onDuplicate()` does it.
// `onDuplicateAsActual`, when given, adds a second item, "Duplicate as Actual", which is never greyed out.
function EntryContextMenu({ x, y, canDuplicate, hint, onDuplicate, onDuplicateAsActual, onClose }) {
  const menuRef = React.useRef(null);
  const [pos, setPos] = React.useState({ left: x, top: y });

  // Measured before the browser paints, so the menu never shows at the wrong place first.
  React.useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setPos({
      left: Math.max(4, Math.min(x, window.innerWidth - width - 4)),
      top: Math.max(4, Math.min(y, window.innerHeight - height - 4)),
    });
    const first = el.querySelector("button:not(:disabled)");
    if (first) first.focus();                           // so Enter / Space work straight away
  }, [x, y]);

  React.useEffect(() => {
    const onKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onClose);
    window.addEventListener("blur", onClose);
    window.addEventListener("scroll", onClose, true);   // true: also a scroll inside any element
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("blur", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  return (
    // A transparent layer over the page: whatever is clicked outside the menu only closes it, nothing underneath reacts.
    <div className="context-layer" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
      <ul ref={menuRef} className="context-menu" role="menu" style={{ left: pos.left, top: pos.top }} onClick={(e) => e.stopPropagation()}>
        <li role="none">
          <button role="menuitem" type="button" disabled={!canDuplicate} title={canDuplicate ? undefined : hint} onClick={onDuplicate}>
            Duplicate
          </button>
        </li>
        {onDuplicateAsActual && (
          <li role="none">
            <button role="menuitem" type="button" onClick={onDuplicateAsActual}>Duplicate as Actual</button>
          </li>
        )}
      </ul>
    </div>
  );
}
