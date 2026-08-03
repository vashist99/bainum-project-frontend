import { ShieldAlert } from "lucide-react";
import { DELETION_CLAUSE, TERMS_SECTIONS, TERMS_VERSION } from "../lib/termsContent.js";

/**
 * Terms and Conditions acceptance block for registration pages.
 * The account-deletion/data-preservation clause is always visible; the
 * full terms are collapsed and optional to read. Controlled component:
 * parent owns `accepted` and disables its submit until it is true.
 */
const TermsAcceptance = ({ accepted, onChange }) => {
    return (
        <div className="space-y-3">
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 flex gap-2">
                <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold">Account deletion and your data</p>
                    <p className="text-sm text-base-content/80 mt-1">{DELETION_CLAUSE}</p>
                </div>
            </div>

            <details className="collapse collapse-arrow bg-base-200 rounded-lg">
                <summary className="collapse-title text-sm font-medium min-h-0 py-3">
                    Read the full Terms and Conditions ({TERMS_VERSION})
                </summary>
                <div className="collapse-content max-h-72 overflow-y-auto space-y-3 text-sm text-base-content/80">
                    {TERMS_SECTIONS.map((section) => (
                        <div key={section.heading}>
                            <p className="font-semibold">{section.heading}</p>
                            <p className="mt-0.5 whitespace-pre-line">{section.body}</p>
                        </div>
                    ))}
                </div>
            </details>

            <label className="flex items-start gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm mt-0.5"
                    checked={accepted}
                    onChange={(e) => onChange?.(e.target.checked)}
                />
                <span className="text-sm">
                    I have read and accept the Terms and Conditions, including the
                    account-deletion policy above.
                </span>
            </label>
        </div>
    );
};

export default TermsAcceptance;
