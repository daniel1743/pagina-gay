/**
 * Página para sembrar conversaciones reales en la sala principal
 *
 * Acceso: /seed-conversaciones
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { sembrarConversacionesReales, CONVERSACIONES_COHERENTES } from '@/utils/seedConversacionesReales';
import { CheckCircle, AlertCircle, Loader2, Sprout, MessageSquare, Users, TrendingUp } from 'lucide-react';

const SeedConversaciones = () => {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);

  const handleSeed = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para sembrar conversaciones",
        variant: "destructive"
      });
      return;
    }

    setSeeding(true);
    setError(null);
    setCompleted(false);

    try {
      const result = await sembrarConversacionesReales('principal', (prog) => {
        setProgress(prog);
      });

      setCompleted(true);
      toast({
        title: "✅ Conversaciones sembradas",
        description: `${result.totalMensajes} mensajes en ${result.totalConversaciones} conversaciones`,
      });

    } catch (err) {
      console.error('Error sembrando conversaciones:', err);
      setError(err.message);
      toast({
        title: "❌ Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Sprout className="w-10 h-10 text-green-400" />
            Sembrar Conversaciones Reales
          </h1>
          <p className="text-gray-300">
            Genera un historial de conversaciones coherentes y naturales en la sala principal
          </p>
        </div>

        {/* Info Card */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            ¿Qué hace esto?
          </h2>
          <div className="space-y-3 text-gray-300">
            <p>
              Este proceso sembrará <strong className="text-white">{CONVERSACIONES_COHERENTES.length} conversaciones reales</strong> en
              la sala "principal" con las siguientes características:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-green-400">✅ Coherentes:</strong> Conversaciones que siguen un hilo lógico</li>
              <li><strong className="text-green-400">✅ Morbosas:</strong> Contenido sexual/picante pero natural</li>
              <li><strong className="text-green-400">✅ Variadas:</strong> Diferentes temas (gym, apps, salir del closet, etc.)</li>
              <li><strong className="text-green-400">✅ Humanas:</strong> Con errores de tipeo, emojis naturales</li>
              <li><strong className="text-red-400">❌ NO spam:</strong> Sin repeticiones robóticas</li>
              <li><strong className="text-red-400">❌ NO monótonas:</strong> Conversaciones dinámicas e interesantes</li>
            </ul>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-700">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Conversaciones</p>
                <p className="text-2xl font-bold text-white">{CONVERSACIONES_COHERENTES.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-900/50 to-teal-900/50 border-green-700">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Usuarios ficticios</p>
                <p className="text-2xl font-bold text-white">10</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-700">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Total mensajes</p>
                <p className="text-2xl font-bold text-white">
                  {CONVERSACIONES_COHERENTES.reduce((sum, c) => sum + c.mensajes.length, 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Temas de conversaciones */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">Temas incluidos:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {CONVERSACIONES_COHERENTES.map((conv, index) => (
              <div key={index} className="bg-gray-700/30 rounded px-3 py-2 text-sm text-gray-300">
                {conv.tema}
              </div>
            ))}
          </div>
        </Card>

        {/* Progress */}
        {progress && (
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Progreso: {progress.current} / {progress.total} conversaciones</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-400">
                Sembrando: <span className="text-white">{progress.tema}</span>
              </p>
              <p className="text-xs text-gray-500">
                {progress.mensajes} mensajes sembrados
              </p>
            </div>
          </Card>
        )}

        {/* Success */}
        {completed && (
          <Card className="p-6 bg-green-900/20 border-green-700">
            <div className="flex items-center gap-3 text-green-400">
              <CheckCircle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">¡Conversaciones sembradas exitosamente!</h3>
                <p className="text-sm text-gray-300">
                  La sala "principal" ahora tiene un historial de conversaciones reales
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="p-6 bg-red-900/20 border-red-700">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Error al sembrar conversaciones</h3>
                <p className="text-sm text-gray-300">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSeed}
            disabled={seeding || completed}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-6 text-lg"
          >
            {seeding ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sembrando conversaciones...
              </>
            ) : completed ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Completado
              </>
            ) : (
              <>
                <Sprout className="w-5 h-5 mr-2" />
                Sembrar Conversaciones
              </>
            )}
          </Button>
        </div>

        {/* Warning */}
        {!user && (
          <Card className="p-4 bg-yellow-900/20 border-yellow-700">
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Debes iniciar sesión para sembrar conversaciones</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SeedConversaciones;
