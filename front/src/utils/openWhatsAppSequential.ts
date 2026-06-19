export function openWhatsAppSequential(links: string[], onEach?: (i: number) => void, intervalMs = 600) {
  links.forEach((link, i) => {
    setTimeout(() => {
      window.open(link, '_blank')
      if (onEach) onEach(i)
    }, i * intervalMs)
  })
}
