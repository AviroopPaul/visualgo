const s = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const Play = () => (
  <svg {...s} fill="currentColor" stroke="none"><path d="M7 4.8v14.4a1 1 0 0 0 1.5.86l12-7.2a1 1 0 0 0 0-1.72l-12-7.2A1 1 0 0 0 7 4.8Z" /></svg>
)
export const Pause = () => (
  <svg {...s} fill="currentColor" stroke="none"><rect x="6" y="4.5" width="4" height="15" rx="1.2" /><rect x="14" y="4.5" width="4" height="15" rx="1.2" /></svg>
)
export const StepBack = () => <svg {...s}><path d="M18 6 10 12l8 6V6Z" fill="currentColor" /><path d="M6 6v12" /></svg>
export const StepFwd = () => <svg {...s}><path d="m6 6 8 6-8 6V6Z" fill="currentColor" /><path d="M18 6v12" /></svg>
export const Rewind = () => <svg {...s}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
export const Shuffle = () => (
  <svg {...s}><path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="m15 15 6 6" /><path d="M4 4l5 5" /></svg>
)
export const Code = () => <svg {...s}><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></svg>
export const Sound = ({ on }: { on: boolean }) => (
  <svg {...s}>
    <path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor" />
    {on ? <><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" /></> : <path d="m22 9-6 6M16 9l6 6" />}
  </svg>
)
export const Chevron = () => <svg {...s}><path d="m6 9 6 6 6-6" /></svg>
export const Close = () => <svg {...s}><path d="M18 6 6 18M6 6l12 12" /></svg>
export const Copy = () => <svg {...s}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
export const Info = () => <svg {...s}><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
export const Flag = () => <svg {...s}><path d="M4 22V4" /><path d="M4 4h13l-2 4 2 4H4" /></svg>
export const GitHub = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" /></svg>
)
