'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { ALL_COUNTRY_CODES, CountryCodeItem, findCountry } from '@/lib/country-codes'

interface CountryCodeSelectorProps {
  value: string // e.g. '+91'
  onChange: (dialCode: string, country: CountryCodeItem) => void
  disabled?: boolean
  className?: string
}

export default function CountryCodeSelector({
  value,
  onChange,
  disabled = false,
}: CountryCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedCountry = useMemo(() => {
    return findCountry(value) || ALL_COUNTRY_CODES[0]
  }, [value])

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return ALL_COUNTRY_CODES
    const q = search.trim().toLowerCase()
    return ALL_COUNTRY_CODES.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    )
  }, [search])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    } else {
      setSearch('')
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 42,
          padding: '0 10px',
          background: '#f8fafc',
          border: '1.5px solid #cbd5e1',
          borderRadius: 8,
          fontSize: 13.5,
          fontWeight: 600,
          color: '#0f172a',
          cursor: disabled ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
          outline: 'none',
          transition: 'all 0.15s ease',
        }}
        title={`Selected: ${selectedCountry.name} (${selectedCountry.dialCode})`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span style={{ fontSize: 18 }}>{selectedCountry.flag}</span>
        <span>{selectedCountry.dialCode}</span>
        <span style={{ fontSize: 10, color: '#64748b', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          ▼
        </span>
      </button>

      {/* Searchable Dropdown / Modal */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1100,
            width: 'clamp(280px, 85vw, 340px)',
            maxHeight: 380,
            background: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search Bar */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 14,
                  color: '#94a3b8',
                }}
              >
                🔍
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search country or calling code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 30px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Country List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: 4 }}>
            {filteredCountries.length === 0 ? (
              <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 12.5, color: '#64748b' }}>
                No country found matching &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredCountries.map(c => {
                const isSelected = c.dialCode === selectedCountry.dialCode && c.code === selectedCountry.code
                return (
                  <button
                    key={`${c.code}-${c.dialCode}`}
                    type="button"
                    onClick={() => {
                      onChange(c.dialCode, c)
                      setIsOpen(false)
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: 'none',
                      background: isSelected ? '#ecfdf5' : 'transparent',
                      color: isSelected ? '#047857' : '#1e293b',
                      fontSize: 13,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = '#f1f5f9'
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{c.flag}</span>
                      <span
                        style={{
                          fontWeight: isSelected ? 700 : 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {c.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: isSelected ? '#059669' : '#64748b',
                        marginLeft: 8,
                        flexShrink: 0,
                      }}
                    >
                      {c.dialCode}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

