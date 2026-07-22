export const TREATMENT_STATUS: Record<string, { label: string; dot: string; badge: string }> = {
  pendente:     { label: 'Pendente',      dot: 'bg-slate-300 dark:bg-slate-600',   badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
  em_andamento: { label: 'Em andamento',  dot: 'bg-amber-400',                     badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  concluido:    { label: 'Concluído ✓',   dot: 'bg-emerald-500',                   badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
}

export const TREATMENT_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(TREATMENT_STATUS).map(([key, value]) => [key, value.label])
)
