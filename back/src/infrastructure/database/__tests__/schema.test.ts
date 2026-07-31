import { createHash } from 'crypto';
import { describe, expect, it } from 'vitest';
import { hashPw, verifyPw } from '../schema';

describe('hashPw/verifyPw', () => {
  it('gera hash bcrypt e verifica a mesma senha', () => {
    const hash = hashPw('minhaSenha123');
    expect(hash.startsWith('$2')).toBe(true);
    expect(verifyPw('minhaSenha123', hash)).toBe(true);
  });

  it('rejeita senha errada contra um hash bcrypt', () => {
    const hash = hashPw('minhaSenha123');
    expect(verifyPw('senhaErrada', hash)).toBe(false);
  });

  it('ainda aceita o formato legado SHA-256, por compatibilidade', () => {
    const legacyHash = createHash('sha256').update('senhaAntiga' + '_df2024').digest('hex');
    expect(verifyPw('senhaAntiga', legacyHash)).toBe(true);
    expect(verifyPw('outraSenha', legacyHash)).toBe(false);
  });
});
