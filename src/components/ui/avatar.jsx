
import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';
import { DEFAULT_AVATAR_SRC, getSafeAvatarSrc, isAllowedAvatarSrc } from '@/utils/avatar';

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef(({ className, src, fetchPriority, onError, ...props }, ref) => {
  const safeSrc = getSafeAvatarSrc(src);
  const handleError = (event) => {
    // Radix recibe el error para activar AvatarFallback. El src de respaldo
    // evita que el navegador deje un icono de imagen rota si el recurso remoto
    // existe en datos pero ya no está disponible.
    if (onError) onError(event);
    if (isAllowedAvatarSrc(event?.currentTarget?.src) && event.currentTarget.src !== DEFAULT_AVATAR_SRC) {
      event.currentTarget.src = DEFAULT_AVATAR_SRC;
    }
  };

  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={safeSrc}
      onError={handleError}
      className={cn('aspect-square h-full w-full rounded-full object-cover', className)}
      {...(fetchPriority ? { fetchpriority: fetchPriority } : {})}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
  
