import React from 'react';
import { Shield } from 'lucide-react';
import { useCanonical } from '@/hooks/useCanonical';
import { COMMUNITY_POLICY_VERSION, getPolicyCopy } from '@/content/communityPolicy';

const CommunityPolicyPage = () => {
  useCanonical('/normas-comunidad');
  const copy = getPolicyCopy('es');

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.94))] shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
        <div className="border-b border-white/10 px-6 py-8 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/75">
                Normas y Politicas
              </p>
              <h1 className="mt-1 text-3xl font-bold text-white">
                {copy.title}
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            Version {COMMUNITY_POLICY_VERSION}. Este documento establece el blindaje base de
            comunidad para Chactivo y se aplica a ingreso, permanencia, moderacion y sanciones.
          </p>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-8">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <p className="text-sm leading-7 text-slate-100">{copy.summary}</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">{copy.privacyNotice}</p>
          </div>

          {copy.sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              <div className="mt-4 space-y-3">
                {section.points.map((point) => (
                  <p key={point} className="rounded-xl border border-white/8 bg-slate-950/35 px-4 py-3 text-sm leading-7 text-slate-300">
                    {point}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
            <h2 className="text-xl font-semibold text-white">Resumen Operativo</h2>
            <div className="mt-4 space-y-3">
              <p className="rounded-xl border border-white/8 bg-slate-950/35 px-4 py-3 text-sm leading-7 text-slate-300">
                Menores, grooming, odio, amenazas, coercion, extorsion, drogas y contenido ilegal
                se consideran categorias de alto riesgo.
              </p>
              <p className="rounded-xl border border-white/8 bg-slate-950/35 px-4 py-3 text-sm leading-7 text-slate-300">
                Chactivo puede remover contenido, limitar funciones, silenciar, suspender o cerrar
                cuentas segun severidad, reincidencia y riesgo para la comunidad.
              </p>
              <p className="rounded-xl border border-white/8 bg-slate-950/35 px-4 py-3 text-sm leading-7 text-slate-300">
                La seguridad de la comunidad no es negociable. Al continuar en Chactivo aceptas
                estas reglas y las medidas de proteccion aplicables.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CommunityPolicyPage;
