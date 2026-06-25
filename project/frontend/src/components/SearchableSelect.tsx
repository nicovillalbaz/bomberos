import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'

export type SearchableSelectOption = {
  value: string
  label: string
  hint?: string
}

type SearchableSelectProps = {
  value: string
  onChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder: string
  className?: string
  disabled?: boolean
  noResultsText?: string
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  disabled = false,
  noResultsText = 'Sin resultados',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const selected = options.find((option) => option.value === value)

  const filteredOptions = useMemo(() => {
    const needle = normalize(query.trim())
    if (!needle) return options
    return options.filter((option) =>
      normalize(`${option.label} ${option.hint ?? ''}`).includes(needle)
    )
  }, [options, query])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const selectOption = (nextValue: string) => {
    onChange(nextValue)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false)
      setQuery('')
      return
    }

    if (event.key === 'Enter' && open && filteredOptions[0]) {
      event.preventDefault()
      selectOption(filteredOptions[0].value)
    }
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        disabled={disabled}
        value={open ? query : selected?.label ?? ''}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true)
          setQuery('')
        }}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          if (value) onChange('')
        }}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
        autoComplete="off"
      />

      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">{noResultsText}</div>
          ) : filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => selectOption(option.value)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                option.value === value ? 'bg-red-50 text-red-800' : ''
              }`}
            >
              <span className="block font-medium">{option.label}</span>
              {option.hint && <span className="block text-xs text-gray-500">{option.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
