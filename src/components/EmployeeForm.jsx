import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { DEPARTMENTS } from "../lib/departments";
import { formatName, formatRole } from "../lib/format";

const empty = {
  first_name: "",
  middle_name: "",
  last_name: "",
  number: "",
  department: "",
  role: "",
};

// "Amiscua" → "A."   /   "" → ""
function middleInitial(middle_name) {
  const m = (middle_name || "").trim();
  return m ? m[0].toUpperCase() + "." : "";
}

// Builds "LAST, FIRST M." for the `name` column (all caps)
function buildFullName({ first_name, middle_name, last_name }) {
  const f = (first_name || "").trim();
  const m = middleInitial(middle_name);
  const l = (last_name || "").trim();

  const firstMiddle = [f, m].filter(Boolean).join(" ");
  if (l && firstMiddle) return `${l}, ${firstMiddle}`.toUpperCase();
  if (l) return l.toUpperCase();
  return firstMiddle.toUpperCase();
}

// Find the next employee number by looking at existing numbers
async function getNextEmployeeNumber() {
  const { data, error } = await supabase.from("employees").select("number");

  if (error || !data) return "1001";

  const nums = data.map((r) => parseInt(r.number, 10)).filter((n) => !isNaN(n));

  if (nums.length === 0) return "1001";
  const max = Math.max(...nums);
  return String(max + 1);
}

export default function EmployeeForm({ open, editing, onDone, onCancel }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [loadingNumber, setLoadingNumber] = useState(false);

  // Load form values when the modal opens
  useEffect(() => {
    if (!open) return;

    if (editing) {
      setForm({
        first_name: editing.first_name || "",
        middle_name: editing.middle_name || "",
        last_name: editing.last_name || "",
        number: editing.number || "",
        department: editing.department || "",
        role: editing.role || "",
      });
      return;
    }

    // Adding new — fetch the next auto-assigned number
    setForm(empty);
    setLoadingNumber(true);
    let cancelled = false;

    (async () => {
      const next = await getNextEmployeeNumber();
      if (!cancelled) {
        setForm((f) => ({ ...f, number: next }));
        setLoadingNumber(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, editing]);

  // Lock body scroll + close on Esc
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim(),
      last_name: form.last_name.trim(),
      name: buildFullName(form),
      number: form.number.trim(),
      department: form.department.trim(),
      role: form.role.trim(),
    };

    let error;
    if (editing) {
      ({ error } = await supabase
        .from("employees")
        .update(payload)
        .eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("employees").insert(payload));
    }

    setSaving(false);
    if (error) return alert(error.message);

    setForm(empty);
    onDone();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              {editing ? "Edit employee" : "Add new employee"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {editing
                ? "Update the details and save your changes."
                : "Fill in the details to register a new staff member."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            title="Close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="First name">
                <input
                  required
                  autoFocus
                  value={form.first_name}
                  onChange={(e) =>
                    update("first_name", formatName(e.target.value))
                  }
                  placeholder="e.g. JUAN"
                  className="uppercase w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                />
              </Field>

              <Field label="Middle name">
                <input
                  value={form.middle_name}
                  onChange={(e) =>
                    update("middle_name", formatName(e.target.value))
                  }
                  placeholder="e.g. SANTOS"
                  className="uppercase w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                />
              </Field>

              <Field label="Last name">
                <input
                  required
                  value={form.last_name}
                  onChange={(e) =>
                    update("last_name", formatName(e.target.value))
                  }
                  placeholder="e.g. DELA CRUZ"
                  className="uppercase w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                />
              </Field>
            </div>

            {/* Department + Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Department">
                <select
                  required
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition ${
                    form.department ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  <option value="" disabled>
                    Select department
                  </option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d} className="text-slate-800">
                      {d}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Role">
                <input
                  required
                  value={form.role}
                  onChange={(e) => update("role", formatRole(e.target.value))}
                  placeholder="e.g. CASHIER"
                  className="uppercase w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                />
              </Field>
            </div>

            {/* Preview */}
            <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 px-4 py-2.5 flex items-center gap-2 text-sm">
              <span className="text-slate-500 text-xs">Display name:</span>
              <span className="font-medium text-slate-800 uppercase">
                {buildFullName(form) || "—"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loadingNumber}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 active:scale-95 shadow-sm shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : editing ? (
                "Save changes"
              ) : (
                "Add employee"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
