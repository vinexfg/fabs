import type { CSSProperties } from 'react'
import styles from './Skeleton.module.css'

function Skel({ className = '', style = {} }: { className?: string; style?: CSSProperties }) {
  return <div className={`${styles.shimmer} ${className}`} style={style} />
}

export function SkeletonStatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
      {[0, 1, 2].map(i => (
        <div key={i} className={styles.statCardSkel}>
          <Skel className={styles.iconSkel} />
          <div className="flex-1 min-w-0">
            <Skel className={styles.valueSkel} />
            <Skel className={styles.labelSkel} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className={styles.sectionSkel}>
      <Skel className={styles.sectionTitleSkel} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.rowSkel}>
          <Skel className={styles.avatarSkel} />
          <div className="flex-1 min-w-0">
            <Skel className={styles.nameSkel} />
            <Skel className={styles.subSkel} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonPatientHeader() {
  return (
    <>
      <div className={styles.headerSkel}>
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <Skel className={styles.avatarLgSkel} />
          <div className="flex-1 min-w-0 w-full">
            <Skel className={styles.nameLgSkel} />
            <Skel className={styles.metaSkel} />
            <div className="flex gap-2 mt-3">
              <Skel className={styles.badgeSkel} />
              <Skel className={styles.badgeSkel} />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.tabBarSkel}>
        {[0,1,2,3,4,5].map(i => <Skel key={i} className={styles.tabSkel} />)}
      </div>
      <div className={styles.sectionSkel}>
        <Skel className={styles.sectionTitleSkel} />
        {[0,1,2].map(i => (
          <div key={i} className={styles.rowSkel}>
            <div className="flex-1 min-w-0">
              <Skel className={styles.nameSkel} />
              <Skel className={styles.subSkel} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
