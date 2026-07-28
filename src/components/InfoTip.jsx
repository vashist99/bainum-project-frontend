import { useId, useState } from "react";
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
 * parent action does not fire.
 */
const InfoTip = ({ helpKey, text, className = "" }) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  const copy = text ?? helpFor(helpKey);

  if (!copy) return null;

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="More information"
        aria-describedby={open ? id : undefined}
        className="inline-flex items-center text-base-content/40 hover:text-primary focus-visible:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/50 rounded-full"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Info className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[70] w-64 rounded-lg border border-base-300 bg-base-100 p-3 text-xs font-normal leading-snug text-base-content shadow-xl whitespace-normal text-left normal-case tracking-normal"
        >
          {copy}
        </span>
      )}
    </span>
  );
};

export default InfoTip;
