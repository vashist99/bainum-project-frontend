import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { helpFor } from "../lib/helpText.js";

/**
 * Small "i" icon that reveals a short explanatory box on hover and on
 * keyboard focus (aria-describedby points at the visible tooltip). Copy is
 * looked up in the central help-text map via `helpKey`; pass `text` to
 * override. Renders nothing when there is no copy, so placements are safe
 * even if a key is removed.
 *
 * Safe to nest inside links/buttons: clicks on the icon are stopped so the
 * parent action does not fire. The tip is portaled so card overflow does
 * not clip it, and it stays inside the viewport.
 */
const InfoTip = ({ helpKey, text, className = "" }) => {
  const id = useId();
  const buttonRef = useRef(null);
  const closeTimer = useRef(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState(null);
  const copy = text ?? helpFor(helpKey);

  const place = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(256, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8));
    const estimatedHeight = 112;
    const below = rect.bottom + 8;
    const top = below + estimatedHeight > window.innerHeight - 8
      ? Math.max(8, rect.top - estimatedHeight - 8)
      : below;
    setBox({ top, left, width });
  };

  const show = () => {
    clearTimeout(closeTimer.current);
    place();
    setOpen(true);
  };

  const hideSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => {
    if (!open) return undefined;
    place();
    const update = () => place();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  if (!copy) return null;

  const tip = open && box && typeof document !== "undefined"
    ? createPortal(
      <span
        role="tooltip"
        id={id}
        style={{ top: box.top, left: box.left, width: box.width }}
        className="fixed z-[80] rounded-lg border border-base-300 bg-base-100 p-3 text-xs font-normal leading-snug text-base-content shadow-xl whitespace-normal text-left normal-case tracking-normal"
        onMouseEnter={show}
        onMouseLeave={hideSoon}
      >
        {copy}
      </span>,
      document.body
    )
    : null;

  return (
    <span className={`relative inline-flex items-center shrink-0 align-middle ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label="More information"
        aria-describedby={open ? id : undefined}
        className="inline-flex items-center justify-center w-6 h-6 -my-1 text-base-content/50 hover:text-primary focus-visible:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/50 rounded-full"
        onFocus={show}
        onBlur={hideSoon}
        onMouseEnter={show}
        onMouseLeave={hideSoon}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (open) setOpen(false);
          else show();
        }}
      >
        <Info className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      {tip}
    </span>
  );
};

export default InfoTip;
