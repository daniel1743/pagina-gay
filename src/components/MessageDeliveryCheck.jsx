/**
 * ✓ Componente de Checks de Entrega
 * Sistema similar a WhatsApp
 */
export default function MessageDeliveryCheck({ message, isOwnMessage }) {
  if (!isOwnMessage) return null;

  const status = message.status || 'sent';
  const deliveredCount = message.deliveredTo?.length || 0;
  const readCount = message.readBy?.length || 0;

  // Estados:
  // - sent: ✓ gris (1 check)
  // - delivered: ✓✓ gris (2 checks)
  // - read: ✓✓ azul (2 checks azules)

  const getCheckColor = () => {
    if (status === 'read' || readCount > 0) return '#53bdeb'; // Azul WhatsApp
    if (status === 'delivered' || deliveredCount > 0) return '#8696a0'; // Gris
    return '#8696a0'; // Gris por defecto
  };

  const showDoubleCheck = status === 'delivered' || status === 'read' || deliveredCount > 0;

  return (
    <div className="inline-flex items-center gap-0.5 ml-1" title={`${status} - ${deliveredCount} entregado(s), ${readCount} leído(s)`}>
      {/* Primer check */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M5.5 8.5L7.5 10.5L11 6"
          stroke={getCheckColor()}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Segundo check (si está entregado o leído) */}
      {showDoubleCheck && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="-ml-2">
          <path
            d="M5.5 8.5L7.5 10.5L11 6"
            stroke={getCheckColor()}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
