export const COMMUNITY_POLICY_ROUTE = '/normas-comunidad';
export const COMMUNITY_POLICY_VERSION = '2026-04-12';

export const COMMUNITY_POLICY_STORAGE = {
  acceptedFlag: 'chactivo_community_policy_accepted',
  acceptedAt: 'chactivo_community_policy_accepted_at',
  version: 'chactivo_community_policy_version',
};

export const POLICY_COPY = {
  es: {
    badge: 'Normas y Politicas',
    title: 'Blindaje de Comunidad Chactivo',
    summary:
      'Chactivo es solo para mayores de 18 anos. Protegemos a la comunidad frente a menores, odio, violencia, coercion, drogas y conductas ilegales.',
    privacyNotice:
      'No mostraremos tu edad publicamente. Solo la usamos para verificar mayoria de edad y reforzar medidas de seguridad.',
    acceptanceLabel:
      'Confirmo que tengo 18 anos o mas y acepto las normas y politicas de seguridad de Chactivo.',
    linkLabel: 'Leer normas y politicas completas',
    sections: [
      {
        title: 'Acceso Solo Para Adultos',
        points: [
          'El acceso a Chactivo esta reservado exclusivamente para personas de 18 anos o mas.',
          'Cualquier declaracion de minoria de edad, grooming o facilitacion de acceso a menores activa remocion inmediata y escalamiento interno.',
        ],
      },
      {
        title: 'Cero Tolerancia',
        points: [
          'Se prohibe discurso de odio, amenazas, acoso, coercion, extorsion y violencia.',
          'Se prohibe promocionar, coordinar o facilitar drogas, sustancias ilegales o actividad delictiva.',
          'Se prohibe compartir datos personales o empujar a otros usuarios a canales externos con fines abusivos o fraudulentos.',
        ],
      },
      {
        title: 'Moderacion Y Medidas',
        points: [
          'Chactivo puede eliminar contenido, silenciar, suspender o cerrar cuentas segun gravedad y reincidencia.',
          'La plataforma puede preservar evidencia relevante y colaborar con autoridades cuando corresponda conforme a la ley.',
        ],
      },
      {
        title: 'Responsabilidad Del Usuario',
        points: [
          'Cada usuario es responsable de la veracidad de la informacion que entrega y de sus interacciones dentro de la plataforma.',
          'Al continuar en Chactivo, aceptas estas normas, las decisiones de moderacion y las medidas de proteccion aplicables.',
        ],
      },
    ],
  },
  pt: {
    badge: 'Normas e Politicas',
    title: 'Blindagem Da Comunidade Chactivo',
    summary:
      'Chactivo e somente para maiores de 18 anos. Protegemos a comunidade contra menores, odio, violencia, coercao, drogas e condutas ilegais.',
    privacyNotice:
      'Nao mostraremos sua idade publicamente. Ela sera usada apenas para verificar maioridade e reforcar medidas de seguranca.',
    acceptanceLabel:
      'Confirmo que tenho 18 anos ou mais e aceito as normas e politicas de seguranca do Chactivo.',
    linkLabel: 'Ler normas e politicas completas',
    sections: [
      {
        title: 'Acesso Apenas Para Adultos',
        points: [
          'O acesso ao Chactivo e exclusivo para pessoas com 18 anos ou mais.',
          'Qualquer declaracao de menoridade, grooming ou facilitacao de entrada de menores gera remocao imediata e escalamento interno.',
        ],
      },
      {
        title: 'Tolerancia Zero',
        points: [
          'E proibido discurso de odio, ameacas, assedio, coercao, extorsao e violencia.',
          'E proibido promover, coordenar ou facilitar drogas, substancias ilegais ou atividade criminosa.',
          'E proibido compartilhar dados pessoais ou empurrar usuarios para canais externos com fins abusivos ou fraudulentos.',
        ],
      },
      {
        title: 'Moderacao E Medidas',
        points: [
          'O Chactivo pode remover conteudo, silenciar, suspender ou encerrar contas conforme gravidade e reincidencia.',
          'A plataforma pode preservar evidencias relevantes e cooperar com autoridades quando cabivel conforme a lei.',
        ],
      },
      {
        title: 'Responsabilidade Do Usuario',
        points: [
          'Cada usuario e responsavel pela veracidade das informacoes que fornece e pelas interacoes dentro da plataforma.',
          'Ao continuar no Chactivo, voce aceita estas normas, as decisoes de moderacao e as medidas de protecao aplicaveis.',
        ],
      },
    ],
  },
};

export const getPolicyCopy = (locale = 'es') => POLICY_COPY[locale] || POLICY_COPY.es;
