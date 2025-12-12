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
import { Flag, X, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const UserProfileModal = ({ user, onClose, onReport }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <DialogContent className="bg-card border text-foreground max-w-sm rounded-2xl">
          <DialogHeader className="items-center text-center">
             <div className={`rounded-full ${
               user.role === 'admin'
                 ? 'admin-avatar-ring'
                 : user.verified
                   ? 'verified-avatar-ring'
                   : user.isPremium
                     ? 'premium-avatar-ring'
                     : ''
             } mb-4`}>
              <Avatar className="w-24 h-24 text-4xl">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="bg-secondary">
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <DialogTitle className="text-foreground text-2xl flex items-center gap-2">
              {user.username}
              {(user.isPremium || user.role === 'admin') && (
                <CheckCircle className="w-5 h-5 text-[#FFD700]"/>
              )}
              {user.verified && !user.isPremium && user.role !== 'admin' && (
                <CheckCircle className="w-5 h-5 text-[#1DA1F2]"/>
              )}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Miembro desde {new Date().getFullYear()}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-4 mt-4">
            <Button
              onClick={() => {
                onReport();
                onClose();
              }}
              variant="outline"
              className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400"
            >
              <Flag className="w-4 h-4 mr-2" /> Reportar
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-50 text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogContent>
      </motion.div>
    </Dialog>
  );
};

export default UserProfileModal;