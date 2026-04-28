/**
 * AvatarMedallion — circular icon-based portrait.
 *
 * The game does not ship raster portraits, so a "portrait" is a glyph
 * inside a coloured medallion. The medallion's ring colour comes from
 * the preset's `accent` token; the glyph inherits the same tint.
 *
 * @module renderer/components/AvatarMedallion
 */
import { Icon } from './Icon';
import { getAvatarPreset } from '@/data/avatars';

/**
 * Tailwind colour-class lookup. Tailwind's JIT scanner can't parse
 * dynamic class strings, so we explicitly enumerate every accent + tone
 * combination here. Every class referenced in this map is therefore
 * statically discoverable in the build.
 */
const ACCENT_CLASSES: Record<
  'accent-gold' | 'accent-blue' | 'accent-red',
  { ring: string; text: string; bg: string }
> = {
  'accent-gold': {
    ring: 'ring-accent-gold/60',
    text: 'text-accent-gold',
    bg: 'bg-accent-gold/10',
  },
  'accent-blue': {
    ring: 'ring-accent-blue/60',
    text: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
  },
  'accent-red': {
    ring: 'ring-accent-red/60',
    text: 'text-accent-red',
    bg: 'bg-accent-red/10',
  },
};

export interface AvatarMedallionProps {
  /** Preset id; falls back to the first preset when unknown. */
  avatarId: string | null | undefined;
  /** Outer diameter in pixels. Default 64. */
  size?: number;
  /** Optional aria-label override. Defaults to the preset's label. */
  ariaLabel?: string;
}

/**
 * Renders the circular medallion at the requested size. The glyph is
 * sized to ~55% of the medallion so the ring stays prominent.
 */
export function AvatarMedallion(props: AvatarMedallionProps): JSX.Element {
  const { avatarId, size = 64, ariaLabel } = props;
  const preset = getAvatarPreset(avatarId);
  const tone = ACCENT_CLASSES[preset.accent];
  const glyphSize = Math.round(size * 0.55);
  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `${preset.label} avatar`}
      data-testid="avatar-medallion"
      data-preset={preset.id}
      className={`inline-flex items-center justify-center rounded-full ring-2 ${tone.ring} ${tone.bg} ${tone.text}`}
      style={{ width: size, height: size }}
    >
      <Icon name={preset.icon} size={glyphSize} aria-hidden />
    </div>
  );
}
