import React, { useState, useRef } from 'react'

export interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface SuggestionItem {
  place_id: number
  short_label: string
  display_name: string
}

export function deriveShortLabel(displayName: string): string {
  const parts = displayName.split(',')
  return parts.slice(0, 2).map(p => p.trim()).join(', ')
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder,
  error,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortController = useRef<AbortController | null>(null)

  const fetchSuggestions = async (query: string) => {
    if (abortController.current) {
      abortController.current.abort()
    }
    const controller = new AbortController()
    abortController.current = controller

    setIsLoading(true)
    setApiError(null)
    setIsOpen(true)

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10&countrycodes=in`
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' },
      })

      if (!res.ok) {
        throw new Error('Non-200 response')
      }

      const data: NominatimResult[] = await res.json()
      const items: SuggestionItem[] = data.map(r => ({
        place_id: r.place_id,
        short_label: deriveShortLabel(r.display_name),
        display_name: r.display_name,
      }))
      setSuggestions(items)
      setIsOpen(true)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setApiError('Suggestions load nahi ho sake')
      setIsOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (val === '') {
      onChange('')
      setIsOpen(false)
      setSuggestions([])
      return
    }

    debounceTimer.current = setTimeout(() => {
      if (val.length >= 2) {
        fetchSuggestions(val)
      }
    }, 300)
  }

  const selectSuggestion = (item: SuggestionItem) => {
    onChange(item.short_label)
    setInputValue(item.short_label)
    setIsOpen(false)
    setActiveIndex(-1)
  }

  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault()
        selectSuggestion(suggestions[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const renderDropdown = () => {
    if (!isOpen) return null

    const dropdownStyle: React.CSSProperties = {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      zIndex: 1000,
      maxHeight: 300,
      overflowY: 'auto',
    }

    if (isLoading) {
      return (
        <div style={dropdownStyle}>
          <div style={{ padding: '10px 14px', color: '#64748b', fontSize: 14 }}>
            Dhundh raha hai...
          </div>
        </div>
      )
    }

    if (apiError) {
      return (
        <div style={dropdownStyle}>
          <div style={{ padding: '10px 14px', color: '#ef4444', fontSize: 14 }}>
            Suggestions load nahi ho sake
          </div>
        </div>
      )
    }

    if (suggestions.length === 0) {
      return (
        <div style={dropdownStyle}>
          <div style={{ padding: '10px 14px', color: '#64748b', fontSize: 14 }}>
            Koi jagah nahi mili
          </div>
        </div>
      )
    }

    return (
      <div style={dropdownStyle}>
        {suggestions.slice(0, 10).map((item, index) => (
          <div
            key={item.place_id}
            onMouseDown={() => selectSuggestion(item)}
            style={{
              padding: '10px 14px',
              cursor: 'pointer',
              borderBottom: '1px solid #f1f5f9',
              background: index === activeIndex ? '#f3f0ff' : 'white',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>{item.short_label}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{item.display_name}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 10,
          border: '1.5px solid #c4b5fd',
          fontSize: 14,
          outline: 'none',
          boxSizing: 'border-box',
          color: '#1e293b',
          background: '#fff',
        }}
      />
      {renderDropdown()}
      {error && (
        <p style={{ color: 'red', fontSize: 12, margin: '4px 0 0 0' }}>{error}</p>
      )}
    </div>
  )
}
