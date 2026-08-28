/**
 * VOC desactivado.
 *
 * Chactivo no genera mensajes automáticos en salas reales. Se mantiene esta
 * API no-op porque ChatPage aún la importa durante la transición arquitectónica;
 * cualquier mensaje visible debe provenir de una persona o de un aviso de
 * sistema claramente identificado y autorizado.
 */

const disabled = () => undefined;

export const sendVOCMessageIfNeeded = async () => undefined;

export const clearVOCHistory = disabled;

export const resetVOCCooldown = disabled;

export const monitorActivityAndSendVOC = async () => undefined;
