/**
 * Ventana global de chat privado persistente.
 * Renderizada a nivel de app para que no se cierre al cambiar de sección.
 * Solo se cierra cuando el usuario cierra explícitamente la ventana.
 */
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrivateChat } from '@/contexts/PrivateChatContext';
import PrivateChatWindow from './PrivateChatWindow';
import { setInPrivateChat, clearInPrivateChat } from '@/services/presenceService';
import { toast } from '@/components/ui/use-toast';

export default function GlobalPrivateChatWindow() {
  const { user } = useAuth();
  const { openPrivateChats, closePrivateChat, maxOpenPrivateChats } = usePrivateChat();

  if (!openPrivateChats?.length || !user?.id) return null;

  const handleClose = (chatId = null) => {
    if (chatId) return closePrivateChat(chatId);
    closePrivateChat();
  };

  return (
    <>
      {openPrivateChats.map((chatWindow, index) => (
        <PrivateChatWindow
          key={chatWindow.chatId || `${chatWindow?.partner?.userId || chatWindow?.partner?.id || 'chat'}-${index}`}
          user={chatWindow.user || user}
          partner={chatWindow.partner}
          chatId={chatWindow.chatId}
          roomId={chatWindow.roomId ?? null}
          initialMessage={chatWindow.initialMessage ?? ''}
          autoFocus={index === openPrivateChats.length - 1}
          windowIndex={index}
          onEnterPrivate={setInPrivateChat}
          onLeavePrivate={clearInPrivateChat}
          onArchiveConversation={(chatId) => handleClose(chatId || chatWindow.chatId)}
          onDeleteConversation={(chatId) => handleClose(chatId || chatWindow.chatId)}
          onClose={(chatId) => handleClose(chatId || chatWindow.chatId)}
          onViewProfile={() => {
            toast({
              title: 'Ver perfil',
              description: 'Perfil completo en actualización. Puedes abrir Baúl para ver más datos.',
            });
          }}
        />
      ))}
    </>
  );
}
