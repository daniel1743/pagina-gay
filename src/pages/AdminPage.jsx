import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, Users, MessageSquare, TrendingUp, ArrowLeft,
  CheckCircle, XCircle, Clock, Eye, UserPlus, LogIn, BarChart3,
  Ticket, Activity, FileText, Search, Filter, Ban, VolumeX, Bell, Send, Megaphone
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  subscribeToTodayStats, 
  getStatsForDays, 
  getMostUsedFeatures, 
  getExitPages 
} from '@/services/analyticsService';
import { 
  subscribeToTickets, 
  updateTicketStatus 
} from '@/services/ticketService';
import {
  subscribeToSanctions,
  revokeSanction,
  getSanctionStats,
  SANCTION_TYPES
} from '@/services/sanctionsService';
import {
  createBroadcastNotification,
  sendWelcomeToAllExistingUsers,
  NOTIFICATION_TYPES
} from '@/services/systemNotificationsService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SanctionUserModal from '@/components/sanctions/SanctionUserModal';
import SanctionsFAQ from '@/components/sanctions/SanctionsFAQ';
import AdminChatWindow from '@/components/admin/AdminChatWindow';
import ReportStatusDropdown from '@/components/admin/ReportStatusDropdown';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [sanctions, setSanctions] = useState([]);
  const [selectedUserToSanction, setSelectedUserToSanction] = useState(null);
  const [showSanctionModal, setShowSanctionModal] = useState(false);
  const [showSanctionsFAQ, setShowSanctionsFAQ] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Estadísticas de reportes
  const [reportStats, setReportStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    rejectedReports: 0
  });

  // Estadísticas de analytics (tiempo real)
  const [analyticsStats, setAnalyticsStats] = useState({
    pageViews: 0,
    registrations: 0,
    logins: 0,
    messagesSent: 0,
    roomsCreated: 0,
    roomsJoined: 0,
    pageExits: 0,
  });

  // Estadísticas de tickets
  const [ticketStats, setTicketStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
  });

  // Estadísticas de sanciones
  const [sanctionStats, setSanctionStats] = useState({
    total: 0,
    active: 0,
    warnings: 0,
    tempBans: 0,
    permBans: 0,
    mutes: 0,
  });

  // Datos de análisis
  const [mostUsedFeatures, setMostUsedFeatures] = useState([]);
  const [exitPages, setExitPages] = useState([]);
  const [historicalStats, setHistoricalStats] = useState([]);

  const [isAdmin, setIsAdmin] = useState(false);

  // Estado para formulario de notificaciones
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: NOTIFICATION_TYPES.ANNOUNCEMENT,
    icon: '📢',
    priority: 'normal',
    link: '',
  });
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [isSendingWelcome, setIsSendingWelcome] = useState(false);
  
  // ✅ NUEVO: Estados para chat con usuarios
  const [chatTarget, setChatTarget] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Verificar si el usuario es admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user || user.isAnonymous || user.isGuest) {
        navigate('/');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        const userData = userDoc.data();
        const role = userData?.role;

        // Aceptar tanto 'admin' como 'administrator'
        if (role === 'admin' || role === 'administrator') {
          setIsAdmin(true);
        } else {
          toast({
            title: "Acceso Denegado",
            description: "No tienes permisos de administrador",
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin:', error);
        toast({
          title: "Error",
          description: "No se pudo verificar tu rol de administrador",
          variant: "destructive",
        });
        navigate('/');
      }
    };

    checkAdmin();
  }, [user, navigate]);

  // Cargar reportes en tiempo real
  useEffect(() => {
    if (!isAdmin) return;

    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }));

      setReports(reportsData);

      // Calcular estadísticas
      const stats = {
        totalReports: reportsData.length,
        pendingReports: reportsData.filter(r => r.status === 'pending').length,
        resolvedReports: reportsData.filter(r => r.status === 'resolved').length,
        rejectedReports: reportsData.filter(r => r.status === 'rejected').length
      };

      setReportStats(stats);
    }, (error) => {
      console.error('Error loading reports:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los reportes",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Suscribirse a estadísticas de analytics en tiempo real
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToTodayStats((stats) => {
      setAnalyticsStats({
        pageViews: stats.pageViews || 0,
        registrations: stats.registrations || 0,
        logins: stats.logins || 0,
        messagesSent: stats.messagesSent || 0,
        roomsCreated: stats.roomsCreated || 0,
        roomsJoined: stats.roomsJoined || 0,
        pageExits: stats.pageExits || 0,
      });
      setLoading(false);
    }, (error) => {
      // Si hay error, establecer loading en false y valores por defecto
      console.error('Error loading analytics stats:', error);
      setAnalyticsStats({
        pageViews: 0,
        registrations: 0,
        logins: 0,
        messagesSent: 0,
        roomsCreated: 0,
        roomsJoined: 0,
        pageExits: 0,
      });
      setLoading(false);
    });

    // Timeout de seguridad: si después de 5 segundos no hay datos, establecer loading en false
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearTimeout(timeout);
    };
  }, [isAdmin]);

  // Cargar tickets en tiempo real
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = subscribeToTickets((ticketsData) => {
      setTickets(ticketsData);
      
      const stats = {
        totalTickets: ticketsData.length,
        openTickets: ticketsData.filter(t => t.status === 'open').length,
        inProgressTickets: ticketsData.filter(t => t.status === 'in_progress').length,
        resolvedTickets: ticketsData.filter(t => t.status === 'resolved' || t.status === 'closed').length,
      };
      
      setTicketStats(stats);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Cargar sanciones en tiempo real
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = subscribeToSanctions((sanctionsData) => {
      setSanctions(sanctionsData);
      
      // Cargar estadísticas
      getSanctionStats().then(stats => {
        setSanctionStats(stats);
      }).catch(error => {
        console.error('Error loading sanction stats:', error);
        // Establecer estadísticas por defecto si falla
        setSanctionStats({
          total: 0,
          active: 0,
          warnings: 0,
          tempBans: 0,
          permBans: 0,
          mutes: 0,
        });
      });
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Cargar análisis de uso y abandono
  useEffect(() => {
    if (!isAdmin) return;

    const loadAnalytics = async () => {
      try {
        const [features, exits, history] = await Promise.all([
          getMostUsedFeatures(10),
          getExitPages(10),
          getStatsForDays(7)
        ]);

        setMostUsedFeatures(features);
        setExitPages(exits);
        setHistoricalStats(history);
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    };

    loadAnalytics();
  }, [isAdmin]);

  // Actualizar estado de reporte
  const handleUpdateReportStatus = async (reportId, newStatus, reporterId = null) => {
    try {
      // Usar el servicio actualizado que envía notificaciones
      const { updateReportStatus } = await import('@/services/reportService');
      await updateReportStatus(reportId, newStatus, null, reporterId);

      toast({
        title: "Reporte Actualizado",
        description: `Estado cambiado a: ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el reporte",
        variant: "destructive",
      });
    }
  };

  // ✅ NUEVO: Función para abrir chat con usuario
  const handleOpenChat = (report) => {
    setChatTarget({
      userId: report.reporterId,
      username: report.reporterUsername,
      avatar: null, // Se puede obtener del usuario si es necesario
      reportId: report.id,
    });
    setShowChat(true);
  };

  // Actualizar estado de ticket
  const handleUpdateTicketStatus = async (ticketId, newStatus, adminNotes = null) => {
    try {
      await updateTicketStatus(ticketId, newStatus, user.id, adminNotes);
      toast({
        title: "Ticket Actualizado",
        description: `Estado cambiado a: ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el ticket",
        variant: "destructive",
      });
    }
  };

  // Sancionar usuario desde reporte
  const handleSanctionFromReport = (report) => {
    setSelectedUserToSanction({
      id: report.targetId || report.id,
      username: report.targetUsername || 'Usuario Desconocido',
    });
    setShowSanctionModal(true);
  };

  // Revocar sanción
  const handleRevokeSanction = async (sanctionId) => {
    try {
      await revokeSanction(sanctionId, user.id, 'Revocada por administrador');
      toast({
        title: "Sanción Revocada",
        description: "La sanción ha sido revocada exitosamente",
      });
    } catch (error) {
      console.error('Error revoking sanction:', error);
      toast({
        title: "Error",
        description: "No se pudo revocar la sanción",
        variant: "destructive",
      });
    }
  };

  const getSanctionTypeLabel = (type) => {
    switch (type) {
      case SANCTION_TYPES.WARNING: return 'Advertencia';
      case SANCTION_TYPES.TEMP_BAN: return 'Suspensión Temporal';
      case SANCTION_TYPES.PERM_BAN: return 'Expulsión Permanente';
      case SANCTION_TYPES.MUTE: return 'Silenciado';
      case SANCTION_TYPES.RESTRICT: return 'Restringido';
      default: return type;
    }
  };

  const getSanctionTypeColor = (type) => {
    switch (type) {
      case SANCTION_TYPES.WARNING: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case SANCTION_TYPES.TEMP_BAN: return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case SANCTION_TYPES.PERM_BAN: return 'bg-red-500/20 text-red-400 border-red-500/30';
      case SANCTION_TYPES.MUTE: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case SANCTION_TYPES.RESTRICT: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getReasonLabel = (reason) => {
    switch (reason) {
      case 'spam': return 'Spam';
      case 'harassment': return 'Acoso';
      case 'inappropriate_content': return 'Contenido Inapropiado';
      case 'profanity': return 'Groserías/Insultos';
      case 'fake_account': return 'Cuenta Falsa';
      case 'violence_threats': return 'Amenazas/Violencia';
      case 'illegal_content': return 'Contenido Ilegal';
      case 'other': return 'Otra';
      default: return reason;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'open':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'resolved':
      case 'closed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
      case 'open':
        return <Clock className="w-4 h-4" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Activity className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTypeEmoji = (type) => {
    switch (type) {
      case 'spam': return '🚫';
      case 'harassment': return '⚠️';
      case 'inappropriate': return '🔞';
      case 'fake': return '🎭';
      case 'other': return '❓';
      default: return '📝';
    }
  };

  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'general': return '📋';
      case 'technical': return '🔧';
      case 'billing': return '💳';
      case 'bug': return '🐛';
      case 'feature': return '✨';
      default: return '📝';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  // Establecer título del documento
  useEffect(() => {
    document.title = "Panel Admin - Chactivo";
  }, []);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-purple-300 hover:text-purple-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Lobby
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-effect px-4 py-2 rounded-full border border-purple-500/30">
              <Shield className="w-5 h-5 text-purple-400 inline mr-2" />
              <span className="text-sm font-semibold">Administrador</span>
            </div>
          </div>
        </div>

        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Dashboard completo con analytics, reportes y tickets en tiempo real
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Reportes</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="sanctions">Sanciones</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Estadísticas Principales - Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-effect p-6 rounded-2xl border border-blue-500/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-8 h-8 text-blue-400" />
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-3xl font-bold mb-1">{analyticsStats.pageViews}</h3>
                <p className="text-sm text-muted-foreground">Visualizaciones Hoy</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-effect p-6 rounded-2xl border border-green-500/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <UserPlus className="w-8 h-8 text-green-400" />
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-3xl font-bold mb-1">{analyticsStats.registrations}</h3>
                <p className="text-sm text-muted-foreground">Registros Hoy</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-effect p-6 rounded-2xl border border-purple-500/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <LogIn className="w-8 h-8 text-purple-400" />
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-3xl font-bold mb-1">{analyticsStats.logins}</h3>
                <p className="text-sm text-muted-foreground">Logins Hoy</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-effect p-6 rounded-2xl border border-cyan-500/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-8 h-8 text-cyan-400" />
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-3xl font-bold mb-1">{analyticsStats.messagesSent}</h3>
                <p className="text-sm text-muted-foreground">Mensajes Enviados</p>
              </motion.div>
            </div>

            {/* Estadísticas Secundarias */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-effect p-6 rounded-2xl border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-3xl font-bold mb-1">{reportStats.pendingReports}</h3>
                <p className="text-sm text-muted-foreground">Reportes Pendientes</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-effect p-6 rounded-2xl border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <Ticket className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-3xl font-bold mb-1">{ticketStats.openTickets}</h3>
                <p className="text-sm text-muted-foreground">Tickets Abiertos</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="glass-effect p-6 rounded-2xl border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-pink-400" />
                </div>
                <h3 className="text-3xl font-bold mb-1">{analyticsStats.pageExits}</h3>
                <p className="text-sm text-muted-foreground">Salidas de Página</p>
              </motion.div>
            </div>

            {/* Funcionalidades Más Usadas */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="glass-effect rounded-2xl border border-border p-6"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                Funcionalidades Más Usadas (Últimos 7 días)
              </h2>
              {mostUsedFeatures.length > 0 ? (
                <div className="space-y-3">
                  {mostUsedFeatures.map((feature, index) => (
                    <div key={feature.eventType} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                        <span className="font-medium capitalize">{feature.eventType.replace('_', ' ')}</span>
                      </div>
                      <span className="font-bold text-purple-400">{feature.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No hay datos disponibles aún</p>
              )}
            </motion.div>

            {/* Páginas de Abandono */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="glass-effect rounded-2xl border border-border p-6"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-400" />
                Páginas Donde Más Abandonan (Últimos 7 días)
              </h2>
              {exitPages.length > 0 ? (
                <div className="space-y-3">
                  {exitPages.map((exit, index) => (
                    <div key={exit.pagePath} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                        <span className="font-medium">{exit.pagePath || 'Desconocido'}</span>
                      </div>
                      <span className="font-bold text-red-400">{exit.count} salidas</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No hay datos disponibles aún</p>
              )}
            </motion.div>
          </TabsContent>

          {/* Reportes Tab */}
          <TabsContent value="reports" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-2xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                  Reportes de Usuarios
                </h2>
                <div className="flex gap-2">
                  <div className={`px-3 py-1 rounded-full border ${getStatusColor('pending')}`}>
                    <span className="text-xs font-medium">Pendientes: {reportStats.pendingReports}</span>
                  </div>
                </div>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay reportes por revisar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-effect p-5 rounded-xl border border-border hover:border-accent/50 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{getTypeEmoji(report.type)}</span>
                            <div>
                              <h3 className="font-semibold text-lg capitalize">
                                {report.type || 'Reporte'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Usuario reportado: <span className="text-accent font-medium">{report.targetUsername || 'Desconocido'}</span>
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 pl-11">
                            {report.description || 'Sin descripción'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pl-11">
                            <span>Reportado por: {report.reporterUsername || 'Anónimo'}</span>
                            <span>•</span>
                            <span>{new Date(report.createdAt).toLocaleDateString('es-CL')}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(report.status)}`}>
                            {getStatusIcon(report.status)}
                            <span className="text-xs font-medium capitalize">{report.status}</span>
                          </div>

                          {report.status === 'pending' && (
                            <div className="flex flex-col gap-2">
                              <ReportStatusDropdown
                                report={report}
                                onStatusUpdate={(newStatus) => {
                                  handleUpdateReportStatus(report.id, newStatus, report.reporterId);
                                }}
                                onOpenChat={() => handleOpenChat(report)}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateReportStatus(report.id, 'resolved', report.reporterId)}
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Resolver
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleUpdateReportStatus(report.id, 'rejected', report.reporterId)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Rechazar
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSanctionFromReport(report)}
                                className="border-red-500 text-red-400 hover:bg-red-500/20"
                              >
                                <Ban className="w-4 h-4 mr-1" />
                                Sancionar Usuario
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-2xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Ticket className="w-6 h-6 text-orange-400" />
                  Tickets de Soporte
                </h2>
                <div className="flex gap-2">
                  <div className={`px-3 py-1 rounded-full border ${getStatusColor('open')}`}>
                    <span className="text-xs font-medium">Abiertos: {ticketStats.openTickets}</span>
                  </div>
                </div>
              </div>

              {tickets.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay tickets por revisar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket, index) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-effect p-5 rounded-xl border border-border hover:border-accent/50 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{getCategoryEmoji(ticket.category)}</span>
                            <div>
                              <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                              <p className="text-sm text-muted-foreground">
                                Por: <span className="text-accent font-medium">{ticket.username}</span>
                                <span className="mx-2">•</span>
                                <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                                  {ticket.priority.toUpperCase()}
                                </span>
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 pl-11">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pl-11">
                            <span>Categoría: {ticket.category}</span>
                            <span>•</span>
                            <span>{new Date(ticket.createdAt).toLocaleDateString('es-CL')}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(ticket.status)}`}>
                            {getStatusIcon(ticket.status)}
                            <span className="text-xs font-medium capitalize">{ticket.status}</span>
                          </div>

                          {ticket.status === 'open' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateTicketStatus(ticket.id, 'in_progress')}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                <Activity className="w-4 h-4 mr-1" />
                                En Progreso
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                                className="bg-green-500 hover:bg-green-600 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Resolver
                              </Button>
                            </div>
                          )}
                          {ticket.status === 'in_progress' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Resolver
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Sanciones Tab */}
          <TabsContent value="sanctions" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-2xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Ban className="w-6 h-6 text-red-400" />
                  Sanciones y Expulsiones
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setShowSanctionsFAQ(!showSanctionsFAQ)}
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Preguntas Frecuentes
                </Button>
              </div>

              {/* Estadísticas de Sanciones */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="glass-effect p-4 rounded-lg border border-border">
                  <div className="text-2xl font-bold mb-1">{sanctionStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="glass-effect p-4 rounded-lg border border-yellow-500/30">
                  <div className="text-2xl font-bold mb-1 text-yellow-400">{sanctionStats.warnings}</div>
                  <div className="text-xs text-muted-foreground">Advertencias</div>
                </div>
                <div className="glass-effect p-4 rounded-lg border border-orange-500/30">
                  <div className="text-2xl font-bold mb-1 text-orange-400">{sanctionStats.tempBans}</div>
                  <div className="text-xs text-muted-foreground">Suspensiones</div>
                </div>
                <div className="glass-effect p-4 rounded-lg border border-red-500/30">
                  <div className="text-2xl font-bold mb-1 text-red-400">{sanctionStats.permBans}</div>
                  <div className="text-xs text-muted-foreground">Expulsiones</div>
                </div>
                <div className="glass-effect p-4 rounded-lg border border-purple-500/30">
                  <div className="text-2xl font-bold mb-1 text-purple-400">{sanctionStats.mutes}</div>
                  <div className="text-xs text-muted-foreground">Silenciados</div>
                </div>
              </div>

              {/* Preguntas Frecuentes */}
              {showSanctionsFAQ && (
                <div className="mb-6">
                  <SanctionsFAQ />
                </div>
              )}

              {/* Lista de Sanciones */}
              {sanctions.length === 0 ? (
                <div className="text-center py-12">
                  <Ban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay sanciones registradas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sanctions.map((sanction, index) => (
                    <motion.div
                      key={sanction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-effect p-5 rounded-xl border border-border hover:border-accent/50 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {sanction.type === SANCTION_TYPES.WARNING && <Shield className="w-6 h-6 text-yellow-400" />}
                            {sanction.type === SANCTION_TYPES.TEMP_BAN && <Ban className="w-6 h-6 text-orange-400" />}
                            {sanction.type === SANCTION_TYPES.PERM_BAN && <AlertTriangle className="w-6 h-6 text-red-400" />}
                            {sanction.type === SANCTION_TYPES.MUTE && <VolumeX className="w-6 h-6 text-purple-400" />}
                            <div>
                              <h3 className="font-semibold text-lg">
                                {sanction.username}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Razón: {getReasonLabel(sanction.reason)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 pl-9">
                            {sanction.reasonDescription || 'Sin descripción'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pl-9">
                            <span>Tipo: {getSanctionTypeLabel(sanction.type)}</span>
                            {sanction.expiresAt && (
                              <>
                                <span>•</span>
                                <span>Expira: {new Date(sanction.expiresAt).toLocaleDateString('es-CL')}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>Sancionado por: {sanction.issuedByUsername}</span>
                            <span>•</span>
                            <span>{new Date(sanction.createdAt).toLocaleDateString('es-CL')}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getSanctionTypeColor(sanction.type)}`}>
                            {sanction.status === 'active' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            <span className="text-xs font-medium capitalize">{sanction.status}</span>
                          </div>

                          {sanction.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevokeSanction(sanction.id)}
                              className="border-green-500 text-green-400 hover:bg-green-500/20"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Revocar
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Notificaciones Tab */}
          <TabsContent value="notifications" className="space-y-6">
            {/* ✅ Botón especial para enviar mensaje de bienvenida a usuarios existentes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-effect rounded-2xl border border-pink-500/30 p-6 bg-gradient-to-br from-pink-500/10 to-purple-500/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    🔥 Mensaje de Bienvenida
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Envía el mensaje de bienvenida oficial a todos los usuarios existentes registrados en Chactivo.
                  </p>
                  <div className="text-xs text-muted-foreground bg-background/50 p-3 rounded-lg">
                    <strong>Mensaje:</strong> "¡Ya estás dentro de Chactivo! 🔥 Un lugar para hablar sin filtros, conocer gente como tú y sentirte cómodo siendo quien eres..."
                  </div>
                </div>
                <Button
                  onClick={async () => {
                    if (!confirm('¿Estás seguro de enviar el mensaje de bienvenida a TODOS los usuarios existentes? Esta acción puede tomar varios minutos.')) {
                      return;
                    }

                    setIsSendingWelcome(true);
                    try {
                      const count = await sendWelcomeToAllExistingUsers(user?.id || 'system');
                      
                      toast({
                        title: "✅ Mensaje Enviado",
                        description: `Se envió el mensaje de bienvenida a ${count} usuarios existentes`,
                      });
                    } catch (error) {
                      console.error('Error:', error);
                      toast({
                        title: "❌ Error",
                        description: "Hubo un error al enviar el mensaje. Revisa la consola para más detalles.",
                        variant: "destructive",
                      });
                    } finally {
                      setIsSendingWelcome(false);
                    }
                  }}
                  disabled={isSendingWelcome}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold px-6 py-3"
                >
                  {isSendingWelcome ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar a Todos los Usuarios
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-2xl border border-border p-6"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Bell className="w-6 h-6 text-cyan-400" />
                Enviar Notificación del Sistema
              </h2>

              <div className="space-y-6">
                {/* Formulario */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tipo de notificación */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tipo de Notificación</label>
                    <Select
                      value={notificationForm.type}
                      onValueChange={(value) => setNotificationForm({ ...notificationForm, type: value })}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NOTIFICATION_TYPES.ANNOUNCEMENT}>📢 Anuncio</SelectItem>
                        <SelectItem value={NOTIFICATION_TYPES.UPDATE}>🔄 Actualización</SelectItem>
                        <SelectItem value={NOTIFICATION_TYPES.NEWS}>📰 Noticias</SelectItem>
                        <SelectItem value={NOTIFICATION_TYPES.BROADCAST}>📣 Difusión</SelectItem>
                        <SelectItem value={NOTIFICATION_TYPES.FEATURE}>🎁 Nueva Funcionalidad</SelectItem>
                        <SelectItem value={NOTIFICATION_TYPES.MAINTENANCE}>🔧 Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Prioridad */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Prioridad</label>
                    <Select
                      value={notificationForm.priority}
                      onValueChange={(value) => setNotificationForm({ ...notificationForm, priority: value })}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🟢 Baja</SelectItem>
                        <SelectItem value="normal">🔵 Normal</SelectItem>
                        <SelectItem value="high">🟠 Alta</SelectItem>
                        <SelectItem value="urgent">🔴 Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Icono */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Icono (Emoji)</label>
                    <Input
                      value={notificationForm.icon}
                      onChange={(e) => setNotificationForm({ ...notificationForm, icon: e.target.value })}
                      placeholder="📢"
                      className="bg-background border-border"
                      maxLength={2}
                    />
                  </div>

                  {/* Link (opcional) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Enlace (Opcional)</label>
                    <Input
                      value={notificationForm.link}
                      onChange={(e) => setNotificationForm({ ...notificationForm, link: e.target.value })}
                      placeholder="/premium"
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                {/* Título */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Título de la Notificación</label>
                  <Input
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                    placeholder="¡Nueva actualización disponible!"
                    className="bg-background border-border"
                    maxLength={100}
                  />
                </div>

                {/* Mensaje */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mensaje</label>
                  <Textarea
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                    placeholder="Hemos agregado nuevas funcionalidades increíbles a Chactivo..."
                    className="bg-background border-border min-h-[120px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {notificationForm.message.length}/500 caracteres
                  </p>
                </div>

                {/* Vista previa */}
                <div className="p-4 rounded-lg bg-accent/30 border border-border">
                  <p className="text-xs text-muted-foreground mb-3">Vista Previa:</p>
                  <div className="flex gap-3 p-4 bg-background rounded-lg">
                    <div className="text-2xl">{notificationForm.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-foreground mb-1">
                        {notificationForm.title || 'Título de ejemplo'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {notificationForm.message || 'Mensaje de ejemplo...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botón enviar */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <Megaphone className="w-4 h-4 inline mr-1" />
                    Esta notificación se enviará a <strong>TODOS</strong> los usuarios registrados
                  </p>
                  <Button
                    onClick={async () => {
                      if (!notificationForm.title || !notificationForm.message) {
                        toast({
                          title: "Campos Incompletos",
                          description: "Debes completar el título y el mensaje",
                          variant: "destructive",
                        });
                        return;
                      }

                      setIsSendingNotification(true);
                      try {
                        const count = await createBroadcastNotification(notificationForm, user.id);

                        toast({
                          title: "Notificación Enviada ✅",
                          description: `Se envió la notificación a ${count} usuarios`,
                        });

                        // Limpiar formulario
                        setNotificationForm({
                          title: '',
                          message: '',
                          type: NOTIFICATION_TYPES.ANNOUNCEMENT,
                          icon: '📢',
                          priority: 'normal',
                          link: '',
                        });
                      } catch (error) {
                        console.error('Error sending notification:', error);
                        toast({
                          title: "Error",
                          description: "No se pudo enviar la notificación",
                          variant: "destructive",
                        });
                      } finally {
                        setIsSendingNotification(false);
                      }
                    }}
                    disabled={isSendingNotification || !notificationForm.title || !notificationForm.message}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    {isSendingNotification ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Notificación
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-2xl border border-border p-6"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                Estadísticas Históricas (Últimos 7 días)
              </h2>
              {historicalStats.length > 0 ? (
                <div className="space-y-4">
                  {historicalStats.map((day, index) => (
                    <div key={day.date} className="p-4 rounded-lg bg-background/50">
                      <h3 className="font-semibold mb-3">{new Date(day.date).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Visualizaciones:</span>
                          <span className="ml-2 font-bold">{day.pageViews || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Registros:</span>
                          <span className="ml-2 font-bold">{day.registrations || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Logins:</span>
                          <span className="ml-2 font-bold">{day.logins || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Mensajes:</span>
                          <span className="ml-2 font-bold">{day.messagesSent || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No hay datos históricos disponibles aún</p>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Panel de administración • Actualización en tiempo real • Optimizado para bajo consumo de Firestore</p>
        </div>
      </div>

      {/* Modal de Sancionar Usuario */}
      {selectedUserToSanction && (
        <SanctionUserModal
          isOpen={showSanctionModal}
          onClose={() => {
            setShowSanctionModal(false);
            setSelectedUserToSanction(null);
          }}
          user={selectedUserToSanction}
          currentAdmin={user}
        />
      )}

      {/* ✅ NUEVO: Chat Window para administradores */}
      {chatTarget && (
        <AdminChatWindow
          isOpen={showChat}
          onClose={() => {
            setShowChat(false);
            setChatTarget(null);
          }}
          targetUserId={chatTarget.userId}
          targetUsername={chatTarget.username}
          targetAvatar={chatTarget.avatar}
          reportId={chatTarget.reportId}
        />
      )}
    </div>
  );
};

export default AdminPage;
