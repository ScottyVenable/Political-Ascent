/**
 * AvatarPicker — grid of preset medallions.
 *
 * Used in character creation and (read-only-toggle) on the Character
 * panel. Selection is fully controlled — the parent owns the value.
 *
 * @module renderer/components/AvatarPicker
 */
import { AVATAR_PRESETS } from '@/data/avatars';
import { AvatarMedallion } from './AvatarMedallion';

export interface AvatarPickerProps {
  value: string;
  onChange: (next: string) => void;
  /** When true, the picker renders disabled tiles (display-only). */
  disabled?: boolean;
}

/**
 * Renders one selectable tile per preset. Selected tile gets the gold
 * border + tinted background that the rest of the UI uses for active
 * choices (see CharacterCreation background tiles for the pattern).
 */
export function AvatarPicker(props: AvatarPickerProps): JSX.Element {
  const { value, onChange, disabled = false } = props;
  return (
    <div
      role="radiogroup"
      aria-label="Choose an avatar preset"
      className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      data-testid="avatar-picker"
    >
      {AVATAR_PRESETS.map((preset) => {
        const selected = preset.id === value;
        return (
          <button
            key={preset.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(preset.id)}
            data-testid={`avatar-option-${preset.id}`}
            className={`text-left rounded p-2 border transition-colors flex items-center gap-2 ${
              selected
                ? 'border-accent-gold bg-bg-tertiary'
                : 'border-bg-tertiary bg-bg-secondary hover:bg-bg-tertiary'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <AvatarMedallion avatarId={preset.id} size={44} />
            <span className="flex-1 min-w-0">
              <span className="block font-headline text-sm text-accent-gold truncate">
                {preset.label}
              </span>
              <span className="block text-[11px] text-text-muted truncate">
                {preset.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
