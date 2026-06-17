export interface Patient {
  id: string;
  nome: string;
  dataNascimento: string | null;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  convenio: string | null;
  alergias: string | null;
  medicamentos: string | null;
  conds: string | null;
  queixa: string | null;
  foto: string | null;
  anamnese: string | null;
  criadoEm: string;
}

export interface Treatment {
  id: string;
  patientId: string;
  proc: string;
  dente: string | null;
  valor: number;
  status: string;
  obs: string | null;
  criadoEm: string;
}

export interface Payment {
  id: string;
  patientId: string;
  descricao: string;
  valor: number;
  data: string | null;
  forma: string | null;
  criadoEm: string;
}

export interface Evolution {
  id: string;
  patientId: string;
  proc: string;
  data: string | null;
  hora: string | null;
  notas: string | null;
  proxConsulta: string | null;
  criadoEm: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
  criadoEm: string;
}

export interface OdontogramaTooth {
  id: string;
  patientId: string;
  tooth: string;
  status: string;
  notes: string | null;
  updatedAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Template {
  id: string;
  name: string;
  valor: number;
  obs: string | null;
}

export interface BudgetItem {
  desc: string;
  valor: number;
  [key: string]: unknown;
}

export interface Budget {
  id: string;
  patientId: string;
  items: BudgetItem[];
  desconto: number;
  obs: string;
  status: string;
  criadoEm: string;
}
