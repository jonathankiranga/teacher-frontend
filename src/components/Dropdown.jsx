import React, { useState, useRef, useEffect } from 'react';

export default function Dropdown({ label, options, value, onChange, placeholder = 'Select...' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-xs font-medium mb-1" style={{ color: '#555' }}>{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 rounded-lg border-2 text-left text-base flex items-center justify-between transition-all duration-150"
        style={{
          borderColor: open ? '#7B4F9B' : '#E0E0E0',
          backgroundColor: open ? 'rgba(123,79,155,0.02)' : '#FFFFFF',
          color: selected ? '#333' : '#B0B0B0'
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <svg
          className="w-4 h-4 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: '#999' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute z-50 mt-1 w-full bg-white rounded-lg overflow-hidden"
          style={{
            boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)',
            border: '1px solid #E8E8E8',
            maxHeight: '220px',
            overflowY: 'auto'
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full px-4 py-2.5 text-sm text-left transition-colors duration-75"
              style={{
                backgroundColor: value === opt.value ? 'rgba(123,79,155,0.06)' : 'transparent',
                color: value === opt.value ? '#7B4F9B' : '#333'
              }}
              onMouseEnter={(e) => { if (value !== opt.value) e.currentTarget.style.backgroundColor = '#F8F8F8'; }}
              onMouseLeave={(e) => { if (value !== opt.value) e.currentTarget.style.backgroundColor = ''; }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
