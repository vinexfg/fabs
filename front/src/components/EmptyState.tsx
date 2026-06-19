import styles from './EmptyState.module.css'

function ToothSVG() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.svg}>
      <circle cx="50" cy="50" r="42" fill="currentColor" opacity="0.07"/>
      <path d="M50 16C37 16 24 25 24 38C24 47 28 54 34 59L38 82C38 84 40 86 43 86C46 86 48 84 49 80L50 68L51 80C52 84 54 86 57 86C60 86 62 84 62 82L66 59C72 54 76 47 76 38C76 25 63 16 50 16Z" fill="currentColor" opacity="0.12"/>
      <path d="M50 16C37 16 24 25 24 38C24 47 28 54 34 59L38 82C38 84 40 86 43 86C46 86 48 84 49 80L50 68L51 80C52 84 54 86 57 86C60 86 62 84 62 82L66 59C72 54 76 47 76 38C76 25 63 16 50 16Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M40 36C40 36 44 41 50 41C56 41 60 36 60 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function CalendarSVG() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.svg}>
      <circle cx="50" cy="50" r="42" fill="currentColor" opacity="0.07"/>
      <rect x="16" y="24" width="68" height="56" rx="10" fill="currentColor" opacity="0.1"/>
      <rect x="16" y="24" width="68" height="56" rx="10" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="16" y="24" width="68" height="22" rx="10" fill="currentColor" opacity="0.18"/>
      <line x1="35" y1="14" x2="35" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <line x1="65" y1="14" x2="65" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <rect x="26" y="56" width="12" height="12" rx="4" fill="currentColor" opacity="0.35"/>
      <rect x="44" y="56" width="12" height="12" rx="4" fill="currentColor" opacity="0.35"/>
      <rect x="62" y="56" width="12" height="12" rx="4" fill="currentColor" opacity="0.2"/>
      <rect x="26" y="72" width="12" height="5" rx="2.5" fill="currentColor" opacity="0.2"/>
      <rect x="44" y="72" width="12" height="5" rx="2.5" fill="currentColor" opacity="0.2"/>
    </svg>
  )
}

function DocSVG() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.svg}>
      <circle cx="50" cy="50" r="42" fill="currentColor" opacity="0.07"/>
      <rect x="22" y="14" width="56" height="72" rx="10" fill="currentColor" opacity="0.1"/>
      <rect x="22" y="14" width="56" height="72" rx="10" stroke="currentColor" strokeWidth="2.5"/>
      <line x1="34" y1="36" x2="66" y2="36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="34" y1="50" x2="66" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="34" y1="64" x2="54" y2="64" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function SearchSVG() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.svg}>
      <circle cx="50" cy="50" r="42" fill="currentColor" opacity="0.07"/>
      <circle cx="44" cy="44" r="22" fill="currentColor" opacity="0.1"/>
      <circle cx="44" cy="44" r="22" stroke="currentColor" strokeWidth="3"/>
      <line x1="60" y1="60" x2="76" y2="76" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  )
}

function FinanceSVG() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.svg}>
      <circle cx="50" cy="50" r="42" fill="currentColor" opacity="0.07"/>
      <rect x="14" y="34" width="72" height="48" rx="10" fill="currentColor" opacity="0.1"/>
      <rect x="14" y="34" width="72" height="48" rx="10" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="14" y="34" width="72" height="18" rx="10" fill="currentColor" opacity="0.18"/>
      <circle cx="50" cy="63" r="9" fill="currentColor" opacity="0.2"/>
      <circle cx="50" cy="63" r="9" stroke="currentColor" strokeWidth="2"/>
      <line x1="50" y1="57" x2="50" y2="69" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="44" y1="63" x2="56" y2="63" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="22" y="16" width="16" height="8" rx="4" fill="currentColor" opacity="0.3"/>
    </svg>
  )
}

const SVGS = {
  patients:     <ToothSVG />,
  appointments: <CalendarSVG />,
  evolutions:   <DocSVG />,
  search:       <SearchSVG />,
  finances:     <FinanceSVG />,
}

interface EmptyStateProps {
  type?: keyof typeof SVGS
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ type = 'search', title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.illustration}>
        {SVGS[type] ?? SVGS.search}
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <button className="btn-primary mt-4" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  )
}
