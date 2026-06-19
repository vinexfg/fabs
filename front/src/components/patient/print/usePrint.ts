import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

export function usePrint() {
  const patientFileRef = useRef<HTMLDivElement>(null)
  const receitaRef = useRef<HTMLDivElement>(null)
  const atestadoRef = useRef<HTMLDivElement>(null)

  const printPatientFile = useReactToPrint({ contentRef: patientFileRef })
  const printReceita = useReactToPrint({ contentRef: receitaRef })
  const printAtestado = useReactToPrint({ contentRef: atestadoRef })

  return { patientFileRef, receitaRef, atestadoRef, printPatientFile, printReceita, printAtestado }
}
