import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  User as UserIcon,
  Edit,
  Clock,
  FileText,
  Lock,
  MessageSquare,
  StickyNote
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import {
  subscribeToTicket,
  subscribeToTicketMessages,
  getTicketLogs,
  sendTicketMessage,
  updateTicketStatusAdvanced,
  updateTicketPriority,
  assignTicket,
  TICKET_STATUS,
  TICKET_PRIORITY,
  MESSAGE_TYPE,
  MESSAGE_AUTHOR
} from '@/services/ticketService';
import {
  changeUsername,
  validateUsernameChange,
  checkUserRole
} from '@/services/adminService';
import TicketStatusBadge from '@/components/admin/TicketStatusBadge';
import PriorityPill from '@/components/admin/PriorityPill';
import MessageBubble from '@/components/admin/MessageBubble';
import QuickReplyButtons from '@/components/admin/QuickReplyButtons';
import UserInfoCard from '@/components/admin/UserInfoCard';
import LogEntry from '@/components/admin/LogEntry';

/**
 * PÁGINA: TicketDetailPage
 *
 * Vista detallada de un ticket con:
 * - Información completa del ticket y usuario
 * - Thread de conversación (mensajes externos + notas internas)
 * - Caja de respuesta con modo externo/interno
 * - Acciones administrativas (cambio de estado, prioridad, asignación)
 * - Acciones operacionales (cambio de username, etc.)
 * - Historial de auditoría
 * - Actualización en tiempo real
 */
const TicketDetailPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // Auth state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Ticket data
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Message composition
  const [messageBody, setMessageBody] = useState('');
  const [messageType, setMessageType] = useState(MESSAGE_TYPE.EXTERNAL); // external or internal
  const [sending, setSending] = useState(false);

  // Actions state
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  // Username change state (for username_change category)
  const [newUsername, setNewUsername] = useState('');
  const [usernameValidation, setUsernameValidation] = useState(null);
  const [changingUsername, setChangingUsername] = useState(false);

  // Verificar permisos
  useEffect(() => {
    const checkPermissions = async () => {
      if (!user || user.isAnonymous || user.isGuest) {
        navigate('/');
        return;
      }

      try {
        // Verificar super admin por email primero (sin necesidad de Firestore)
        const SUPER_ADMIN_EMAIL = 'caribenosvenezolanos@gmail.com';
        const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;

        if (isSuperAdmin) {
          console.log('🎉 Super Admin detectado - Acceso garantizado a ticket detail');
          setUserRole({ isAdmin: true, isSupport: true, role: 'admin' });
          setIsAuthorized(true);
          return;
        }

        // Verificar rol desde Firestore
        const roleCheck = await checkUserRole(user.id);
        setUserRole(roleCheck);

        if (roleCheck.isAdmin || roleCheck.isSupport) {
          setIsAuthorized(true);
        } else {
          toast({
            title: "Acceso Denegado",
            description: "No tienes permisos para ver tickets",
            variant: "destructive",
          });
          navigate('/admin');
        }
      } catch (error) {
        console.error('Error checking permissions:', error);

        // Si falla la verificación de Firestore pero es super admin, permitir acceso
        const SUPER_ADMIN_EMAIL = 'caribenosvenezolanos@gmail.com';
        if (user.email === SUPER_ADMIN_EMAIL) {
          console.log('⚠️ Error verificando rol en Firestore, pero super admin detectado - Acceso garantizado');
          setUserRole({ isAdmin: true, isSupport: true, role: 'admin' });
          setIsAuthorized(true);
        } else {
          navigate('/');
        }
      }
    };

    checkPermissions();
  }, [user, navigate]);

  // Suscribirse al ticket
  useEffect(() => {
    if (!isAuthorized || !ticketId) return;

    const unsubscribe = subscribeToTicket(ticketId, (ticketData) => {
      if (!ticketData) {
        setError('Ticket no encontrado');
        setLoading(false);
        return;
      }

      setTicket(ticketData);
      setSelectedStatus(ticketData.status);
      setSelectedPriority(ticketData.priority);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthorized, ticketId]);

  // Suscribirse a mensajes
  useEffect(() => {
    if (!isAuthorized || !ticketId) return;

    const unsubscribe = subscribeToTicketMessages(ticketId, (messagesData) => {
      setMessages(messagesData);
      // Auto-scroll to bottom when new messages arrive
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [isAuthorized, ticketId]);

  // Cargar logs
  useEffect(() => {
    if (!isAuthorized || !ticketId) return;

    const loadLogs = async () => {
      try {
        const logsData = await getTicketLogs(ticketId);
        setLogs(logsData);
      } catch (error) {
        console.error('Error loading logs:', error);
      }
    };

    loadLogs();

    // Recargar logs cada 10 segundos
    const interval = setInterval(loadLogs, 10000);
    return () => clearInterval(interval);
  }, [isAuthorized, ticketId]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageBody.trim()) {
      toast({
        title: "Mensaje vacío",
        description: "Escribe un mensaje antes de enviar",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      await sendTicketMessage(ticketId, {
        type: messageType,
        author: MESSAGE_AUTHOR.STAFF,
        authorUid: user.id,
        authorUsername: user.username || 'Staff',
        body: messageBody.trim(),
        attachments: []
      });

      setMessageBody('');

      toast({
        title: messageType === MESSAGE_TYPE.INTERNAL ? "Nota interna agregada" : "Mensaje enviado",
        description: messageType === MESSAGE_TYPE.INTERNAL
          ? "La nota solo es visible para el equipo"
          : "El usuario recibirá una notificación",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Handle quick reply
  const handleQuickReply = (reply) => {
    setMessageBody(reply.body);
    setMessageType(MESSAGE_TYPE.EXTERNAL);
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (selectedStatus === ticket.status) {
      toast({
        title: "Sin cambios",
        description: "El estado seleccionado es el mismo que el actual",
        variant: "destructive",
      });
      return;
    }

    setUpdatingStatus(true);
    try {
      await updateTicketStatusAdvanced(ticketId, selectedStatus, user.id, {
        reason: `Estado cambiado desde panel admin`
      });

      toast({
        title: "Estado actualizado",
        description: `Ticket marcado como: ${selectedStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle priority update
  const handlePriorityUpdate = async () => {
    if (selectedPriority === ticket.priority) {
      toast({
        title: "Sin cambios",
        description: "La prioridad seleccionada es la misma que la actual",
        variant: "destructive",
      });
      return;
    }

    setUpdatingPriority(true);
    try {
      await updateTicketPriority(ticketId, selectedPriority, user.id);

      toast({
        title: "Prioridad actualizada",
        description: `Prioridad cambiada a: ${selectedPriority}`,
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la prioridad",
        variant: "destructive",
      });
    } finally {
      setUpdatingPriority(false);
    }
  };

  // Handle username validation
  const handleValidateUsername = async () => {
    if (!newUsername.trim()) {
      setUsernameValidation(null);
      return;
    }

    try {
      const validation = await validateUsernameChange(ticket.userUid, newUsername.trim());
      setUsernameValidation(validation);
    } catch (error) {
      console.error('Error validating username:', error);
      setUsernameValidation({
        valid: false,
        errors: ['Error al validar username']
      });
    }
  };

  // Handle username change
  const handleUsernameChange = async () => {
    if (!usernameValidation || !usernameValidation.valid || !usernameValidation.available) {
      toast({
        title: "Username inválido",
        description: usernameValidation?.errors?.join(', ') || "El username no es válido",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`¿Confirmas el cambio de username de "${usernameValidation.currentUsername}" a "${newUsername}"?`)) {
      return;
    }

    setChangingUsername(true);
    try {
      const result = await changeUsername(ticket.userUid, newUsername.trim(), user.id, ticketId);

      if (result.success && !result.skipped) {
        toast({
          title: "Username actualizado",
          description: `Se cambió de "${result.oldUsername}" a "${result.newUsername}"`,
        });

        // Auto-enviar mensaje confirmando cambio
        await sendTicketMessage(ticketId, {
          type: MESSAGE_TYPE.EXTERNAL,
          author: MESSAGE_AUTHOR.STAFF,
          authorUid: user.id,
          authorUsername: user.username || 'Staff',
          body: `¡Listo! Tu nombre de usuario ha sido actualizado exitosamente de "${result.oldUsername}" a "${result.newUsername}". Los cambios ya están visibles en tu perfil.`,
          attachments: []
        });

        // Cambiar estado a resuelto
        await updateTicketStatusAdvanced(ticketId, TICKET_STATUS.RESOLVED, user.id, {
          reason: 'Username cambiado exitosamente'
        });

        setNewUsername('');
        setUsernameValidation(null);
      } else if (result.skipped) {
        toast({
          title: "Sin cambios",
          description: "El username ingresado es el mismo que el actual",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error changing username:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el username",
        variant: "destructive",
      });
    } finally {
      setChangingUsername(false);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'N/A';
    }
  };

  if (loading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error || 'Ticket no encontrado'}</p>
            <Button onClick={() => navigate('/admin/tickets')}>
              Volver a Tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/tickets')}
            className="text-purple-300 hover:text-purple-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Tickets
          </Button>

          <div className="flex items-center gap-2">
            <TicketStatusBadge status={ticket.status} />
            <PriorityPill priority={ticket.priority} />
          </div>
        </div>

        {/* Layout: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Ticket info + Messages + Reply */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{ticket.subject}</CardTitle>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-mono">#{ticket.id.slice(0, 12)}</span>
                      <span>•</span>
                      <span>Categoría: <span className="capitalize">{ticket.category}</span></span>
                      <span>•</span>
                      <span>Creado: {formatDate(ticket.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </CardContent>
            </Card>

            {/* Messages Thread */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Conversación ({messages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay mensajes aún</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isCurrentUserStaff={true}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
            </Card>

            {/* Reply Box */}
            {ticket.status !== TICKET_STATUS.CLOSED && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      Responder
                    </CardTitle>

                    {/* Toggle External/Internal */}
                    <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                      <button
                        onClick={() => setMessageType(MESSAGE_TYPE.EXTERNAL)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          messageType === MESSAGE_TYPE.EXTERNAL
                            ? 'bg-purple-500 text-white'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Externo (usuario ve)
                      </button>
                      <button
                        onClick={() => setMessageType(MESSAGE_TYPE.INTERNAL)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                          messageType === MESSAGE_TYPE.INTERNAL
                            ? 'bg-amber-500 text-white'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        Nota Interna
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick replies */}
                  <QuickReplyButtons
                    onSelectReply={handleQuickReply}
                    disabled={sending}
                  />

                  {/* Text area */}
                  <Textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder={
                      messageType === MESSAGE_TYPE.INTERNAL
                        ? "Escribe una nota interna (solo visible para staff)..."
                        : "Escribe tu respuesta al usuario..."
                    }
                    className="min-h-[120px]"
                    disabled={sending}
                  />

                  {/* Send button */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {messageType === MESSAGE_TYPE.INTERNAL ? (
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Solo el equipo verá esta nota
                        </span>
                      ) : (
                        <span>El usuario recibirá una notificación</span>
                      )}
                    </p>

                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !messageBody.trim()}
                      className={messageType === MESSAGE_TYPE.INTERNAL ? 'bg-amber-500 hover:bg-amber-600' : ''}
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {messageType === MESSAGE_TYPE.INTERNAL ? 'Agregar Nota' : 'Enviar Mensaje'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column: User info + Actions + Logs */}
          <div className="space-y-6">
            {/* User Info */}
            <UserInfoCard userId={ticket.userUid} />

            {/* Actions Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Acciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="status" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="status">Estado</TabsTrigger>
                    <TabsTrigger value="actions">Operaciones</TabsTrigger>
                  </TabsList>

                  {/* Status/Priority Tab */}
                  <TabsContent value="status" className="space-y-4 mt-4">
                    {/* Change status */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Cambiar Estado</label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TICKET_STATUS.OPEN}>Abierto</SelectItem>
                          <SelectItem value={TICKET_STATUS.IN_PROGRESS}>En Progreso</SelectItem>
                          <SelectItem value={TICKET_STATUS.WAITING_USER}>Esperando Usuario</SelectItem>
                          <SelectItem value={TICKET_STATUS.RESOLVED}>Resuelto</SelectItem>
                          <SelectItem value={TICKET_STATUS.CLOSED}>Cerrado</SelectItem>
                          <SelectItem value={TICKET_STATUS.SPAM}>Spam</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleStatusUpdate}
                        disabled={updatingStatus || selectedStatus === ticket.status}
                        size="sm"
                        className="w-full"
                      >
                        {updatingStatus ? 'Actualizando...' : 'Actualizar Estado'}
                      </Button>
                    </div>

                    {/* Change priority */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Cambiar Prioridad</label>
                      <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TICKET_PRIORITY.URGENT}>Urgente</SelectItem>
                          <SelectItem value={TICKET_PRIORITY.HIGH}>Alta</SelectItem>
                          <SelectItem value={TICKET_PRIORITY.MEDIUM}>Media</SelectItem>
                          <SelectItem value={TICKET_PRIORITY.LOW}>Baja</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handlePriorityUpdate}
                        disabled={updatingPriority || selectedPriority === ticket.priority}
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        {updatingPriority ? 'Actualizando...' : 'Actualizar Prioridad'}
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Actions Tab */}
                  <TabsContent value="actions" className="space-y-4 mt-4">
                    {/* Username change (if category is username_change) */}
                    {ticket.category === 'username_change' && (
                      <div className="space-y-3 p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/30">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          Cambiar Username
                        </h4>

                        <div className="space-y-2">
                          <Input
                            placeholder="Nuevo username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            onBlur={handleValidateUsername}
                          />

                          {usernameValidation && (
                            <div className="text-xs">
                              {usernameValidation.valid && usernameValidation.available ? (
                                <div className="text-green-400">
                                  ✓ Username disponible
                                </div>
                              ) : (
                                <div className="text-red-400">
                                  {usernameValidation.errors?.join(', ')}
                                </div>
                              )}
                            </div>
                          )}

                          <Button
                            onClick={handleUsernameChange}
                            disabled={
                              changingUsername ||
                              !newUsername.trim() ||
                              !usernameValidation ||
                              !usernameValidation.valid ||
                              !usernameValidation.available
                            }
                            size="sm"
                            className="w-full bg-indigo-500 hover:bg-indigo-600"
                          >
                            {changingUsername ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Cambiando...
                              </>
                            ) : (
                              'Ejecutar Cambio'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Other actions placeholder */}
                    <div className="text-xs text-muted-foreground text-center py-4">
                      Más acciones próximamente
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Historial ({logs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No hay registros aún
                    </p>
                  ) : (
                    logs.map((log) => (
                      <LogEntry key={log.id} log={log} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
