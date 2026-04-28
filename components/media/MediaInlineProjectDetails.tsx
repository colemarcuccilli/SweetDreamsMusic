'use client';

// components/media/MediaInlineProjectDetails.tsx
//
// Inline project-details form used inside PackageCard + AlaCarteCard.
// Single source of truth for the questionnaire shape — both card kinds
// import this so the field copy + validation stay aligned.
//
// Stateless: parent owns the value + change handler. This makes it
// trivial to reset (parent clears state on add-to-cart) and to read
// for validation (parent decides when "Add" is enabled).

import type { MediaProjectDetails } from '@/lib/media-cart';

export default function MediaInlineProjectDetails({
  value,
  onChange,
}: {
  value: MediaProjectDetails;
  onChange: (v: MediaProjectDetails) => void;
}) {
  const set = <K extends keyof MediaProjectDetails>(k: K, v: MediaProjectDetails[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-3">
      <p className="font-mono text-[11px] uppercase tracking-wider font-bold text-black/60">
        Project details for this piece
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Project name (optional)">
          <input
            type="text"
            value={value.project_name ?? ''}
            onChange={(e) => set('project_name', e.target.value)}
            placeholder='"My EP", "Summer Single"...'
            className={inputCls}
          />
        </Field>
        <Field label="Artist name *">
          <input
            type="text"
            value={value.artist_name}
            onChange={(e) => set('artist_name', e.target.value)}
            placeholder="Name on credits"
            className={inputCls}
            minLength={2}
          />
        </Field>
      </div>

      <Field label="Songs *">
        <input
          type="text"
          value={value.songs}
          onChange={(e) => set('songs', e.target.value)}
          placeholder="Title(s) or short description"
          className={inputCls}
          minLength={2}
        />
      </Field>

      <Field label="Vibe / mood *">
        <input
          type="text"
          value={value.vibe}
          onChange={(e) => set('vibe', e.target.value)}
          placeholder='"Dark + atmospheric", "warm acoustic"...'
          className={inputCls}
          minLength={2}
        />
      </Field>

      <Field label="References (optional)">
        <input
          type="text"
          value={value.references ?? ''}
          onChange={(e) => set('references', e.target.value)}
          placeholder="Links or artist names"
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Target release (optional)">
          <input
            type="date"
            value={value.release_date ?? ''}
            onChange={(e) => set('release_date', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Notes (optional)">
          <input
            type="text"
            value={value.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Anything else"
            className={inputCls}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-wider text-black/55 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full bg-white border-2 border-black/15 px-2.5 py-1.5 text-sm focus:border-black outline-none';
