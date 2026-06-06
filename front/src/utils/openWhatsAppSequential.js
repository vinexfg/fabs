export function openWhatsAppSequential(links, onEach, intervalMs = 600) {
  links.forEach((link, i) => {
    setTimeout(() => {
      window.open(link, '_blank')
      if (onEach) onEach(i)
    }, i * intervalMs)
  })
}
