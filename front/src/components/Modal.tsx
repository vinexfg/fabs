import type { ReactNode } from 'react'
import styles from './Modal.module.css'

interface ModalProps {
  title: string
  onClose: () => void
  onSave: () => void
  saveLabel?: string
  children: ReactNode
  wide?: boolean
}

export default function Modal({ title, onClose, onSave, saveLabel = 'Salvar', children, wide }: ModalProps) {
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={wide ? styles.boxWide : styles.box}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>{children}</div>
        <div className={styles.footer}>
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={onSave} className="btn-primary">{saveLabel}</button>
        </div>
      </div>
    </div>
  )
}
