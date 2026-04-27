import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Lock, Shield } from 'lucide-react';
import { COMMUNITY_POLICY_ROUTE, getPolicyCopy } from '@/content/communityPolicy';

const CommunityPolicyCompactNotice = ({
  locale = 'es',
  className = '',
}) => {
  const copy = getPolicyCopy(locale);

  return (
    <div className={`rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 shadow-[0_8px_24px_rgba(245,158,11,0.08)] ${className}`}>
      <div className="flex items-start gap-2">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
            {copy.badge}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            {copy.summary}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2.5 text-sm text-slate-600">
        <div className="flex items-start gap-2.5 rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-slate-200/80">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
          <p className="leading-5 text-slate-600">{copy.privacyNotice}</p>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-slate-200/80">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
          <p className="leading-5 text-slate-600">
            {locale === 'pt'
              ? 'Menores, odio, violencia, coercao, drogas e condutas ilegais podem resultar em bloqueio, suspensao ou encerramento permanente.'
              : 'Menores, odio, violencia, coercion, drogas y conductas ilegales pueden resultar en bloqueo, suspension o cierre permanente.'}
          </p>
        </div>
      </div>

      <Link
        to={COMMUNITY_POLICY_ROUTE}
        className="mt-3 inline-flex text-sm font-semibold text-sky-600 underline underline-offset-4 hover:text-sky-700"
      >
        {copy.linkLabel}
      </Link>
    </div>
  );
};

export default CommunityPolicyCompactNotice;
