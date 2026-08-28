import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

describe('Firestore rules: controles estáticos de seguridad', () => {
  it('no conserva excepciones de bots, seed ni rooms administrativas artificiales', () => {
    expect(rules).not.toMatch(/isValidBotMessage|isValidAdminSeededMessage|admin_seeded_rooms/);
    expect(rules).toContain('function isAutomatedSenderId');
  });

  it('bloquea IDs automatizados en el camino de mensajes públicos', () => {
    expect(rules).toContain('isAutomatedSenderId(request.resource.data.userId)');
    expect(rules).toContain("roomId == 'principal'");
  });

  it('reserva los mensajes públicos de sistema a una cuenta administrativa', () => {
    const systemRule = rules.match(/function isValidSystemMessage\(\) \{[\s\S]*?\n    \}/)?.[0] || '';
    expect(systemRule).toContain('isAdmin()');
  });

  it('reserva las respuestas editoriales a la identidad oficial', () => {
    const commentsRule = rules.match(/match \/opin_comments\/\{commentId\} \{[\s\S]*?\n    \}/)?.[0] || '';
    expect(commentsRule).toContain("!request.resource.data.keys().hasAny(['isAdminReply', 'authorType'])");
    expect(commentsRule).toContain("request.resource.data.username == 'Equipo Chactivo'");
    expect(commentsRule).toContain("request.resource.data.authorType == 'official_team'");
    expect(commentsRule).toContain('isAdmin()');
  });

  it('permite presencia únicamente al propietario autenticado del documento', () => {
    const presenceRule = rules.match(/match \/roomPresence\/\{roomId\}\/users\/\{userId\} \{[\s\S]*?\n    \}/)?.[0] || '';
    expect(presenceRule).toContain('request.auth.uid == userId');
    expect(presenceRule).not.toMatch(/admin-testing|seed_user/);
  });
});
