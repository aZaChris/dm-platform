// Icone a linea, inline (nessuna libreria). Tracciati in stile Lucide, 24x24.
const D = {
  grid: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  scroll: ['M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4', 'M19 17V5a2 2 0 0 0-2-2H4'],
  map: ['M9 3 3 5.5v15L9 18l6 2.5 6-2.5v-15L15 6z', 'M9 3v15', 'M15 6v14.5'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  crown: ['M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z'],
  moon: ['M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z'],
  key: ['M7.5 21a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z', 'm21 2-9.6 9.6', 'm15.5 7.5 3 3L22 7l-3-3'],
  arrow: ['M7 7h10v10', 'M7 17 17 7'],
  plus: ['M5 12h14', 'M12 5v14'],
  dice: ['M12 2l9 5v10l-9 5-9-5V7z', 'M12 2l9 15H3z'],
  sheet: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M8 13h8', 'M8 17h5'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
}

export function Icon({ name, size = 18 }: { name: keyof typeof D; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {D[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}
