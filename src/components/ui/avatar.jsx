
import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

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

const isInvalidAvatarSrc = (src) => {
  if (!src || typeof src !== 'string') return true;
  const normalized = src.trim().toLowerCase();

  if (!normalized) return true;
  if (normalized === 'undefined' || normalized === 'null') return true;

  // Evita errores de blob expirado persistido en Firestore/localStorage.
  if (normalized.startsWith('blob:')) return true;

  return false;
};

const AvatarImage = React.forwardRef(({ className, src, ...props }, ref) => {
  const safeSrc = isInvalidAvatarSrc(src) ? undefined : src;

  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={safeSrc}
      className={cn('aspect-square h-full w-full rounded-full object-cover', className)}
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
  
