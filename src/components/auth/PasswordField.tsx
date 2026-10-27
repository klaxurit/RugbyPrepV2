import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { tr, type Lang } from '../../i18n/appLabels'

type PasswordFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  lang?: Lang
  fieldSize?: 'md' | 'lg'
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type' | 'value' | 'onChange' | 'size'>

export function PasswordField({
  id,
  label,
  value,
  onChange,
  lang = 'fr',
  fieldSize = 'lg',
  className,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const toggleLabel = tr(visible ? 'password_hide' : 'password_show', lang)
  const sizeClass = fieldSize === 'lg' ? 'h-14 px-5 pr-14' : 'h-12 px-4 pr-12'

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-bold text-fg-soft uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={
            className
            ?? `w-full ${sizeClass} rounded-2xl border-2 border-border-app bg-layer-5 text-fg placeholder:text-fg-faint rf-focus-ring text-sm transition-colors`
          }
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={toggleLabel}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center text-fg-muted hover:text-fg hover:bg-layer-10 transition-colors rf-focus-ring"
        >
          {visible ? (
            <EyeOff className="w-4 h-4" strokeWidth={2.25} aria-hidden />
          ) : (
            <Eye className="w-4 h-4" strokeWidth={2.25} aria-hidden />
          )}
        </button>
      </div>
    </div>
  )
}
