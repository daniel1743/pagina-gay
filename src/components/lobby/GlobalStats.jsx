import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  BubbleChatIcon,
  InformationCircleIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';

const GlobalStats = () => {
  return (
    <section
      aria-labelledby="community-status-title"
      className="mx-auto mb-8 w-full max-w-6xl px-4 sm:mb-12 sm:px-6 lg:px-8"
    >
      <div className="cv-card p-5 sm:p-6 lg:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <HugeiconsIcon icon={UserGroupIcon} size={22} color="currentColor" aria-hidden="true" />
          </div>
          <div>
            <h2 id="community-status-title" className="text-xl font-bold sm:text-2xl">Estado de la comunidad</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">La presencia se muestra únicamente cuando existe una fuente real y disponible.</p>
          </div>
        </div>

        <div className="cv-status-warning mt-6 rounded-xl border p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <HugeiconsIcon icon={InformationCircleIcon} size={21} color="currentColor" className="mt-0.5 shrink-0 text-amber-200" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-amber-100">No hay un contador de actividad disponible</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                No mostramos “usuarios activos ahora”, rankings de salas ni números de relleno. Entra al chat para comprobar el estado real y decide si quieres participar.
              </p>
            </div>
          </div>
        </div>

        <nav aria-label="Acciones de la comunidad" className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="/chat/principal"
            className="cv-button-primary inline-flex min-h-12 rounded-xl px-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-background"
          >
            <HugeiconsIcon icon={BubbleChatIcon} size={19} color="currentColor" className="mr-2" aria-hidden="true" />
            Revisar el chat principal
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="currentColor" className="ml-2" aria-hidden="true" />
          </a>
          <a
            href="/opin"
            className="cv-button-secondary inline-flex min-h-12 rounded-xl px-5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-background"
          >
            Explorar OPIN
          </a>
        </nav>
      </div>
    </section>
  );
};

export default GlobalStats;
