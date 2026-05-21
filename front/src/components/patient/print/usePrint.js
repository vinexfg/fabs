import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

export function usePrint() {
  const patientFileRef = useRef()
  const receitaRef = useRef()
  const atestadoRef = useRef()

  const printPatientFile = useReactToPrint({ contentRef: patientFileRef })
  const printReceita = useReactToPrint({ contentRef: receitaRef })
  const printAtestado = useReactToPrint({ contentRef: atestadoRef })

  return { patientFileRef, receitaRef, atestadoRef, printPatientFile, printReceita, printAtestado }
}
