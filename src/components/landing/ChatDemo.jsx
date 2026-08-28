import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  BubbleChatIcon,
  LockPasswordIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';

const ChatDemo = ({ onJoinClick, title = 'Actividad de la comunidad' }) => {
  return (
    <section
      aria-labelledby="community-preview-title"
      className="w-full overflow-hidden rounded-3xl border border-border/70 bg-card/60 shadow-xl"
    >
      <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <HugeiconsIcon icon={BubbleChatIcon} size={21} color="currentColor" aria-hidden="true" />
          </div>
          <div>
            <h2 id="community-preview-title" className="font-bold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">Estado real, sin actividad inventada</p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
          Se actualiza al entrar
        </span>
      </div>

      <div className="flex min-h-[18rem] flex-col items-center justify-center px-6 py-10 text-center sm:min-h-[22rem]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/10 text-violet-200">
          <HugeiconsIcon icon={UserGroupIcon} size={27} color="currentColor" aria-hidden="true" />
        </div>
        <h3 className="mt-5 text-xl font-bold text-foreground">Aquí no mostramos conversaciones de muestra</h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          La actividad, los mensajes y las personas se cargan desde la sala cuando entras. Si la comunidad está tranquila, lo diremos con claridad en lugar de llenar la pantalla con perfiles o chats ficticios.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground sm:text-sm">
          <span className="inline-flex items-center gap-1.5"><HugeiconsIcon icon={LockPasswordIcon} size={15} color="currentColor" aria-hidden="true" />Comparte solo lo necesario</span>
          <span className="inline-flex items-center gap-1.5"><HugeiconsIcon icon={BubbleChatIcon} size={15} color="currentColor" aria-hidden="true" />Conversación real</span>
        </div>
      </div>

      <div className="border-t border-border/60 bg-muted/10 p-5 sm:p-6">
        <button
          type="button"
          onClick={onJoinClick}
          className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-5 py-3 text-base font-bold text-slate-950 transition hover:from-fuchsia-400 hover:to-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Entrar y revisar la actividad
          <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="currentColor" className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};

export default ChatDemo;
