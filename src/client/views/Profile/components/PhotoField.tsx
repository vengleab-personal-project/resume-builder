import { Camera, Trash2, User } from 'lucide-react';
import type { Translations } from '@/client/hooks/useTranslations';

export type PhotoFieldProps = {
  photoUrl: string;
  /** Drives the empty-state glyph's accessible name. */
  name: string;
  hasError: boolean;
  disabled: boolean;
  labels: Pick<Translations['profile'], 'photoSection' | 'changePhoto' | 'removePhoto' | 'photoError'>;
  onChoose: (file: File) => void;
  onRemove: () => void;
};

export const PhotoField = ({
  photoUrl,
  name,
  hasError,
  disabled,
  labels,
  onChoose,
  onRemove,
}: PhotoFieldProps) => (
  <div className="flex items-center gap-5">
    <div className="w-24 h-24 shrink-0 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- a downscaled data URL
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <User size={36} className="text-slate-300" aria-label={name} />
      )}
    </div>

    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        {labels.photoSection}
      </span>
      <div className="flex flex-wrap gap-2">
        <label
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer ${
            disabled ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <Camera size={13} />
          {labels.changePhoto}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              // Reset so choosing the same file again (after a failure) still fires.
              event.target.value = '';
              if (file) onChoose(file);
            }}
          />
        </label>
        {photoUrl && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 size={13} />
            {labels.removePhoto}
          </button>
        )}
      </div>
      {hasError && <p className="text-xs text-red-600">{labels.photoError}</p>}
    </div>
  </div>
);
