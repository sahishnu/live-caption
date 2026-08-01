import type { ChromaPreset, SessionAction, StyleConfig } from '../session/types'

interface StylePanelProps {
  style: StyleConfig
  dispatch: (action: SessionAction) => void
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-neutral-400">{label}</span>
      <input
        type="number"
        className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-neutral-400">{label}</span>
      <select
        className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-neutral-400">{label}</span>
      <input
        type="color"
        className="h-9 w-full cursor-pointer rounded border border-neutral-700 bg-neutral-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

const alignOptions = [
  { value: 'left' as const, label: 'Left' },
  { value: 'center' as const, label: 'Center' },
  { value: 'right' as const, label: 'Right' },
]

const chromaOptions: { value: ChromaPreset; label: string }[] = [
  { value: 'green', label: 'Green' },
  { value: 'magenta', label: 'Magenta' },
  { value: 'black', label: 'Black' },
  { value: 'transparent', label: 'Transparent' },
]

export function StylePanel({ style, dispatch }: StylePanelProps) {
  const update = (patch: Partial<StyleConfig>) => dispatch({ type: 'style/updated', patch })

  return (
    <section className="flex flex-col gap-4 rounded border border-neutral-800 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Style</h2>
        <button
          type="button"
          className="rounded border border-neutral-600 px-3 py-1 text-sm hover:bg-neutral-800"
          onClick={() => dispatch({ type: 'style/reset' })}
        >
          Reset to defaults
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Text colour" value={style.color} onChange={(color) => update({ color })} />
        <NumberField label="Font size (px)" value={style.fontSizePx} min={12} max={200} onChange={(fontSizePx) => update({ fontSizePx })} />
        <SelectField
          label="Font weight"
          value={String(style.fontWeight)}
          options={[
            { value: '400', label: 'Regular (400)' },
            { value: '500', label: 'Medium (500)' },
            { value: '700', label: 'Bold (700)' },
          ]}
          onChange={(v) => update({ fontWeight: Number(v) })}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">Font family</span>
          <input
            type="text"
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
            value={style.fontFamily}
            onChange={(e) => update({ fontFamily: e.target.value })}
          />
        </label>
        <NumberField
          label="Line height"
          value={style.lineHeight}
          min={1}
          max={3}
          step={0.05}
          onChange={(lineHeight) => update({ lineHeight })}
        />
        <SelectField label="Text alignment" value={style.align} options={alignOptions} onChange={(align) => update({ align })} />
        <SelectField label="Position" value={style.position} options={alignOptions} onChange={(position) => update({ position })} />
        <NumberField
          label="Max width (%)"
          value={style.maxWidthPct}
          min={10}
          max={100}
          onChange={(maxWidthPct) => update({ maxWidthPct })}
        />
        <NumberField
          label="Bottom margin (%)"
          value={style.bottomMarginPct}
          min={0}
          max={50}
          onChange={(bottomMarginPct) => update({ bottomMarginPct })}
        />
        <NumberField label="Max lines" value={style.maxLines} min={1} max={5} onChange={(maxLines) => update({ maxLines })} />
        <CheckboxField label="Uppercase" checked={style.uppercase} onChange={(uppercase) => update({ uppercase })} />
        <NumberField
          label="Fade duration (ms, 0 = cut)"
          value={style.transitionFadeMs}
          min={0}
          max={2000}
          step={50}
          onChange={(transitionFadeMs) => update({ transitionFadeMs })}
        />
        <NumberField
          label="Outline width (px)"
          value={style.outlineWidthPx}
          min={0}
          max={10}
          onChange={(outlineWidthPx) => update({ outlineWidthPx })}
        />
        <ColorField label="Outline colour" value={style.outlineColor} onChange={(outlineColor) => update({ outlineColor })} />
        <CheckboxField label="Drop shadow" checked={style.dropShadow} onChange={(dropShadow) => update({ dropShadow })} />
        <CheckboxField label="Background box" checked={style.boxEnabled} onChange={(boxEnabled) => update({ boxEnabled })} />
        <ColorField label="Box colour" value={style.boxColor} onChange={(boxColor) => update({ boxColor })} />
        <NumberField
          label="Box opacity"
          value={style.boxOpacity}
          min={0}
          max={1}
          step={0.05}
          onChange={(boxOpacity) => update({ boxOpacity })}
        />
        <NumberField
          label="Box padding X (px)"
          value={style.boxPaddingXPx}
          min={0}
          max={80}
          onChange={(boxPaddingXPx) => update({ boxPaddingXPx })}
        />
        <NumberField
          label="Box padding Y (px)"
          value={style.boxPaddingYPx}
          min={0}
          max={80}
          onChange={(boxPaddingYPx) => update({ boxPaddingYPx })}
        />
        <SelectField label="Chroma background" value={style.chromaPreset} options={chromaOptions} onChange={(chromaPreset) => update({ chromaPreset })} />
        <CheckboxField label="Captions shown" checked={style.captionsShown} onChange={(captionsShown) => update({ captionsShown })} />
        <CheckboxField
          label="Hybrid live draft"
          checked={style.hybridLiveDraft}
          onChange={(hybridLiveDraft) => update({ hybridLiveDraft })}
        />
        <NumberField
          label="Idle clear (seconds, 0 = never)"
          value={style.idleClearSeconds}
          min={0}
          max={120}
          onChange={(idleClearSeconds) => update({ idleClearSeconds })}
        />
      </div>
    </section>
  )
}
