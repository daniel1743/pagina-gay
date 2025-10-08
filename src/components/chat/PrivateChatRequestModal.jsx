import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const PrivateChatRequestModal = ({ request, currentUser, onResponse, onClose }) => {
  const isReceiver = currentUser.id === request.to.userId;
  const isSender = currentUser.id === request.from.id;

  if (isSender) {
    return (
       <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-card border text-foreground max-w-sm rounded-2xl">
          <DialogHeader className="items-center text-center">
            <Avatar className="w-20 h-20 border-4 border-cyan-400 mb-4">
              <AvatarImage src={request.to.avatar} alt={request.to.username} />
              <AvatarFallback className="text-3xl bg-secondary">
                {request.to.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <DialogTitle className="text-foreground text-2xl">
              Solicitud Enviada
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Esperando que <span className="font-bold text-accent">{request.to.username}</span> acepte tu invitación.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Cerrar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  if (isReceiver) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-card border text-foreground max-w-sm rounded-2xl">
          <DialogHeader className="items-center text-center">
            <Avatar className="w-20 h-20 border-4 border-accent mb-4">
              <AvatarImage src={request.from.avatar} alt={request.from.username} />
              <AvatarFallback className="text-3xl bg-secondary">
                {request.from.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <DialogTitle className="text-foreground text-2xl">
              ¡Chat Privado!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              <span className="font-bold text-cyan-400">{request.from.username}</span> te ha invitado a un chat privado.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-4">
            <Button
              onClick={() => onResponse(false)}
              variant="outline"
              className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400"
            >
              Rechazar
            </Button>
            <Button
              onClick={() => onResponse(true)}
              className="flex-1 cyan-gradient text-black font-bold"
            >
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};

export default PrivateChatRequestModal;