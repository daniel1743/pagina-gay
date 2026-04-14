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
    <div className={`rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/90">
            {copy.badge}
          </p>
          <p className="mt-1 text-sm text-slate-100">
            {copy.summary}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2 text-xs text-slate-300">
        <div className="flex items-start gap-2">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />
          <p>{copy.privacyNotice}</p>
        </div>
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" />
          <p>
            {locale === 'pt'
              ? 'Menores, odio, violencia, coercao, drogas e condutas ilegais podem resultar em bloqueio, suspensao ou encerramento permanente.'
              : 'Menores, odio, violencia, coercion, drogas y conductas ilegales pueden resultar en bloqueo, suspension o cierre permanente.'}
          </p>
        </div>
      </div>

      <Link
        to={COMMUNITY_POLICY_ROUTE}
        className="mt-3 inline-flex text-sm font-medium text-cyan-300 underline underline-offset-4 hover:text-cyan-200"
      >
        {copy.linkLabel}
      </Link>
    </div>
  );
};

export default CommunityPolicyCompactNotice;
