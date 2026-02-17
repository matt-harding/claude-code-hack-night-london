import { useEffect, useRef, useState } from "react";
import { type Status, STATUSES, STATUS_LABELS, STATUS_COLORS } from "./types";

interface StatusPillProps {
  status: Status;
  onChange: (status: Status) => void;
}

export function StatusPill({ status, onChange }: StatusPillProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="status-pill-wrapper" ref={ref}>
      <button
        className="status-pill"
        style={{
          backgroundColor: `${STATUS_COLORS[status]}20`,
          color: STATUS_COLORS[status],
          borderColor: `${STATUS_COLORS[status]}40`,
        }}
        onClick={() => setOpen(!open)}
      >
        <span className="status-pill-dot" style={{ backgroundColor: STATUS_COLORS[status] }} />
        {STATUS_LABELS[status]}
      </button>
      {open && (
        <div className="status-dropdown">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`status-dropdown-item ${s === status ? "active" : ""}`}
              onClick={() => {
                if (s !== status) onChange(s);
                setOpen(false);
              }}
            >
              <span className="status-pill-dot" style={{ backgroundColor: STATUS_COLORS[s] }} />
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
