/**
 * COMPANION WIDGET
 *
 * Widget flotante discreto que ofrece ayuda a usuarios anónimos
 * - Aparece en esquina inferior derecha
 * - NO invasivo
 * - Diseño moderno y sutil
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CompanionWidget = ({
  isVisible,
  companionMessage,
  suggestions = [],
  loading = false,
  onAcceptHelp,
  onRejectHelp,
  onSelectSuggestion,
  onShowWidget,
  onHideWidget,
  shouldShow = true
}) => {
  // No mostrar si no debe aparecer
  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Mensaje de ayuda flotante */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mb-3 max-w-sm"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold text-sm">
                    Ayuda para empezar
                  </span>
                </div>
                <button
                  onClick={onHideWidget}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4">
                {loading ? (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <span className="text-sm ml-2">Pensando...</span>
                  </div>
                ) : (
                  <>
                    {/* Mensaje principal */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {companionMessage}
                    </p>

                    {/* Sugerencias de primer mensaje */}
                    {suggestions.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Haz clic en una para usarla:
                        </p>
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => onSelectSuggestion(suggestion)}
                            className="w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2"
                          >
                            <Send className="w-3 h-3 text-purple-500" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ) : (
                      /* Botones Sí/No */
                      <div className="flex gap-2">
                        <Button
                          onClick={onAcceptHelp}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm py-2 rounded-lg shadow-md"
                        >
                          Sí, ayúdame
                        </Button>
                        <Button
                          onClick={onRejectHelp}
                          variant="ghost"
                          className="flex-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm py-2"
                        >
                          No, gracias
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer - microcopy */}
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  💬 100% anónimo • Sin registro • Sin presión
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante siempre visible */}
      <motion.button
        onClick={isVisible ? onHideWidget : onShowWidget}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-2xl flex items-center justify-center text-white transition-all hover:shadow-purple-500/50"
      >
        <AnimatePresence mode="wait">
          {isVisible ? (
            <motion.div
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="message"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Badge de notificación (solo si NO está visible) */}
      {!isVisible && companionMessage && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
        >
          <Sparkles className="w-3 h-3 text-white" />
        </motion.div>
      )}
    </div>
  );
};

export default CompanionWidget;
