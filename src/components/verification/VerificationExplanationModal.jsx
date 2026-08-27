import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const VerificationExplanationModal = ({ isOpen, onClose, verificationStatus }) => {
  const { consecutiveDays = 0, daysUntilVerification = 30, verified = false } = verificationStatus || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="w-6 h-6 text-green-400" />
            Insignia de participación
          </DialogTitle>
          <DialogDescription className="text-base">
            Se obtiene por continuidad de acceso; no verifica identidad ni garantiza seguridad
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Estado Actual */}
          <div className="glass-effect p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Tu Progreso Actual
            </h3>
            {verified ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold">¡Tienes la insignia de participación!</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Días consecutivos:</span>
                  <span className="font-bold text-purple-400">{consecutiveDays} / 30</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (consecutiveDays / 30) * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Te faltan <span className="font-bold text-purple-400">{daysUntilVerification} días</span> para obtener la insignia
                </p>
              </div>
            )}
          </div>

          {/* Requisitos para Verificarse */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Requisitos para obtener la insignia
            </h3>
            <div className="space-y-2 pl-7">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">                30 días consecutivos de acceso</p>
                  <p className="text-sm text-muted-foreground">
                    Debes acceder al menos una vez al día durante 30 días seguidos. Esto solo indica continuidad de acceso; no confirma quién eres ni valida el contenido de tu perfil.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Conexión diaria mínima</p>
                  <p className="text-sm text-muted-foreground">
                    Solo necesitas iniciar sesión unos minutos al día. No es necesario estar conectado todo el día.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mantener Verificación */}
          {verified && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Mantener la insignia
              </h3>
              <div className="space-y-2 pl-7">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Máximo 3 días sin conexión</p>
                    <p className="text-sm text-muted-foreground">
                      Para mantener la insignia, no debes pasar más de 3 días sin acceder.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Si pasas 4 días sin conexión</p>
                    <p className="text-sm text-muted-foreground">
                      Al cuarto día sin acceso, perderás la insignia y deberás cumplir nuevamente el periodo consecutivo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Beneficios */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-lg">Qué indica la insignia</h3>
            <ul className="space-y-2 pl-7">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                <span className="text-sm">Insignia de verificación visible en tu perfil</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                <span className="text-sm">Señala continuidad de acceso, no verificación de identidad</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                <span className="text-sm">Puede ayudar a contextualizar la antigüedad de la participación</span>
              </li>
            </ul>
          </div>

          {/* Consejos */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-blue-400">💡 Consejos</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Conéctate todos los días, aunque sea solo para saludar</li>
              <li>• Puedes configurar un recordatorio diario</li>
              <li>• Si olvidaste conectarte un día, el contador se reinicia</li>
              <li>• Una vez verificado, mantén tu racha conectándote al menos cada 3 días</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationExplanationModal;

