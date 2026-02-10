import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, Users, MessageSquare, TrendingUp, ArrowLeft,
  CheckCircle, XCircle, Clock, Eye, UserPlus, LogIn, BarChart3,
  Ticket, Activity, FileText, Search, Filter, Ban, VolumeX, Bell, Send, Megaphone,
  Gift, Award, Star, Crown, Trophy, Zap, Download, User
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
  getExitPages,
  getYesterdayStats,
  calculatePercentageChange,
  exportToCSV,
  downloadCSV
} from '@/services/analyticsService';
import { TrendLineChart, ComparisonBarChart, KPICard } from '@/components/admin/AnalyticsCharts';
import SmartAlertsPanel from '@/components/admin/SmartAlerts';
import SegmentedKPICard from '@/components/admin/SegmentedKPICard';
import ActiveUsersCounter from '@/components/admin/ActiveUsersCounter';
import TimeDistributionChart from '@/components/admin/TimeDistributionChart';
import TrafficSourcesChart from '@/components/admin/TrafficSourcesChart';
import ModerationAlerts from '@/components/admin/ModerationAlerts';
import MessageGenerator from '@/components/admin/MessageGenerator';
import { 
  subscribeToTickets, 
  updateTicketStatus 
} from '@/services/ticketService';
import { setupTicketPermissionInterceptor, testTicketAccess, showFixInstructions } from '@/utils/ticketPermissionDebugger';
import { initializeAdminDebugger } from '@/utils/adminDebugger';
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
import RewardUserModal from '@/components/rewards/RewardUserModal';
import RestoreIdentityButton from '@/components/admin/RestoreIdentityButton';
import { searchUsers, getUserById } from '@/services/userService';
import {
  subscribeToRewards,
  getRewardStats,
  revokeReward,
  getTop20ActiveUsers,
  REWARD_TYPES
} from '@/services/rewardsService';
import {
  getAllThreadsAsAdmin,
  getAllRepliesAsAdmin,
  createThreadAsAdmin,
  updateThreadAsAdmin,
  deleteThreadAsAdmin,
  addReplyAsAdmin,
  updateReplyAsAdmin,
  deleteReplyAsAdmin,
  getReplies
} from '@/services/forumService';
import OpinStablesPanel from '@/components/admin/OpinStablesPanel';
import AdminOpinRepliesPanel from '@/components/admin/AdminOpinRepliesPanel';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, switchToGenericIdentity } = useAuth();
  const [reports, setReports] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [sanctions, setSanctions] = useState([]);
  const [selectedUserToSanction, setSelectedUserToSanction] = useState(null);
  const [showSanctionModal, setShowSanctionModal] = useState(false);
  const [showSanctionsFAQ, setShowSanctionsFAQ] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Estados para búsqueda de usuarios
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Estados para sistema de recompensas
  const [rewards, setRewards] = useState([]);
  const [top20Users, setTop20Users] = useState([]);
  const [selectedUserToReward, setSelectedUserToReward] = useState(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [loadingTop20, setLoadingTop20] = useState(false);
  
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

  // Estadísticas de ayer (para comparaciones)
  const [yesterdayStats, setYesterdayStats] = useState({
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

  // Estadísticas de recompensas
  const [rewardStats, setRewardStats] = useState({
    total: 0,
    active: 0,
    premium: 0,
    verified: 0,
    specialAvatar: 0,
    featured: 0,
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
    targetAudience: 'all', // ⚡ NUEVO: 'all', 'registered', 'guests'
  });
  const [updateVersion, setUpdateVersion] = useState('');
  const [extraExplanation, setExtraExplanation] = useState('');
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [isSendingWelcome, setIsSendingWelcome] = useState(false);

  // Estados para gestión del foro
  const [forumThreads, setForumThreads] = useState([]);
  const [forumReplies, setForumReplies] = useState([]);
  const [loadingForum, setLoadingForum] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [selectedReply, setSelectedReply] = useState(null);
  const [forumFormMode, setForumFormMode] = useState('thread'); // 'thread' o 'reply'
  const [forumFormData, setForumFormData] = useState({
    title: '',
    content: '',
    category: 'Preguntas',
    anonymousId: '',
    threadId: '',
  });

  // Cargar datos del foro cuando se abre la pestaña
  useEffect(() => {
    if (activeTab === 'forum' && isAdmin) {
      const loadForumData = async () => {
        setLoadingForum(true);
        try {
          const [threads, replies] = await Promise.all([
            getAllThreadsAsAdmin(),
            getAllRepliesAsAdmin()
          ]);
          setForumThreads(threads);
          setForumReplies(replies);
        } catch (error) {
          console.error('Error cargando foro:', error);
          toast({
            title: "Error",
            description: "No se pudieron cargar los datos del foro",
            variant: "destructive",
          });
        } finally {
          setLoadingForum(false);
        }
      };
      loadForumData();
    }
  }, [activeTab, isAdmin]);

  // Generar mensaje automáticamente para actualizaciones
  useEffect(() => {
    if (notificationForm.type === NOTIFICATION_TYPES.UPDATE) {
      const version = updateVersion || 'X.X.X';
      const baseMessage = `¡Nueva actualización disponible! Versión ${version}\n\n`;
      const explanation = extraExplanation ? `${extraExplanation}\n\n` : '';
      const fullMessage = `${baseMessage}${explanation}Descubre todas las mejoras y nuevas funcionalidades que hemos preparado para ti.`;
      
      setNotificationForm(prev => {
        // Solo actualizar si los valores realmente cambiaron
        if (prev.title === `🔄 Nueva Actualización v${version}` && 
            prev.message === fullMessage && 
            prev.icon === '🔄') {
          return prev;
        }
        return {
          ...prev,
          title: `🔄 Nueva Actualización v${version}`,
          message: fullMessage,
          icon: '🔄',
        };
      });
    }
  }, [updateVersion, extraExplanation, notificationForm.type]);
  
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
        // ✅ Ignorar errores internos de Firestore
        if (error?.message?.includes('INTERNAL ASSERTION FAILED') || 
            error?.message?.includes('Unexpected state')) {
          console.warn('Firestore internal error checking admin, retrying...');
          // Intentar una vez más después de un breve delay
          setTimeout(async () => {
            try {
              const userDoc = await getDoc(doc(db, 'users', user.id));
              const userData = userDoc.data();
              const role = userData?.role;
              if (role === 'admin' || role === 'administrator') {
                setIsAdmin(true);
              } else {
                navigate('/');
              }
            } catch (retryError) {
              console.error('Error checking admin (retry):', retryError);
              navigate('/');
            }
          }, 1000);
          return;
        }
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

  // 🔍 ADMIN DEBUGGER: Sistema de debugging automático
  useEffect(() => {
    if (!isAdmin) return;

    // Inicializar debugger - muestra estado de admin y captura errores automáticamente
    const cleanup = initializeAdminDebugger();

    return cleanup;
  }, [isAdmin]);

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
        pendingReports: reportsData.filter(r => r.status === 'pending' || r.status === 'open').length,
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

    // Cargar estadísticas de ayer para comparaciones
    const loadYesterdayStats = async () => {
      try {
        const stats = await getYesterdayStats();
        if (stats) {
          setYesterdayStats({
            pageViews: stats.pageViews || 0,
            registrations: stats.registrations || 0,
            logins: stats.logins || 0,
            messagesSent: stats.messagesSent || 0,
            roomsCreated: stats.roomsCreated || 0,
            roomsJoined: stats.roomsJoined || 0,
            pageExits: stats.pageExits || 0,
          });
        }
      } catch (error) {
        console.error('Error loading yesterday stats:', error);
      }
    };

    loadYesterdayStats();

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

  // 🔍 DEBUGGER: Interceptar errores de permisos de tickets
  useEffect(() => {
    const cleanup = setupTicketPermissionInterceptor();
    
    // Exponer funciones de debugging globalmente para uso en consola
    if (typeof window !== 'undefined') {
      window.testTicketAccess = testTicketAccess;
      window.showFixInstructions = showFixInstructions;
    }
    
    return () => {
      cleanup();
      if (typeof window !== 'undefined') {
        delete window.testTicketAccess;
        delete window.showFixInstructions;
      }
    };
  }, []);

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

  // Cargar recompensas en tiempo real
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = subscribeToRewards((rewardsData) => {
      setRewards(rewardsData);

      // Cargar estadísticas
      getRewardStats().then(stats => {
        setRewardStats(stats);
      }).catch(error => {
        console.error('Error loading reward stats:', error);
        setRewardStats({
          total: 0,
          active: 0,
          premium: 0,
          verified: 0,
          specialAvatar: 0,
          featured: 0,
        });
      });
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Cargar TOP 20 usuarios más activos
  useEffect(() => {
    if (!isAdmin) return;

    const loadTop20 = async () => {
      setLoadingTop20(true);
      try {
        const top20 = await getTop20ActiveUsers();
        setTop20Users(top20);
      } catch (error) {
        console.error('Error loading TOP 20 users:', error);
      } finally {
        setLoadingTop20(false);
      }
    };

    loadTop20();
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

  // ✅ NUEVO: Función para abrir chat con usuario (con validación de username)
  const handleOpenChat = (report) => {
    // ✅ CRÍTICO: Validar que haya username antes de abrir chat
    if (!report.reporterId) {
      toast({
        title: "Error",
        description: "No se puede abrir el chat: falta ID de usuario",
        variant: "destructive",
      });
      return;
    }

    if (!report.reporterUsername || !report.reporterUsername.trim()) {
      toast({
        title: "Error",
        description: "No se puede abrir el chat: el usuario no tiene nombre de usuario registrado. Se intentará obtener desde la base de datos.",
        variant: "destructive",
      });
      // Continuar de todas formas, el componente validará y obtendrá el username
    }

    setChatTarget({
      userId: report.reporterId,
      username: report.reporterUsername?.trim() || '', // Usar username del reporte o cadena vacía
      avatar: null,
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

  // Función para buscar usuarios
  const handleUserSearch = async () => {
    if (!userSearchTerm.trim()) {
      setUserSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const results = await searchUsers(userSearchTerm);
      setUserSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "No se pudo buscar usuarios. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSearchingUsers(false);
    }
  };

  // Función para seleccionar usuario y abrir modal de sanción
  const handleSelectUserForSanction = (selectedUser) => {
    setSelectedUserToSanction(selectedUser);
    setShowSanctionModal(true);
    setUserSearchTerm('');
    setUserSearchResults([]);
  };

  // Función para seleccionar usuario y abrir modal de recompensa
  const handleSelectUserForReward = (selectedUser) => {
    setSelectedUserToReward(selectedUser);
    setShowRewardModal(true);
  };

  // Revocar recompensa
  const handleRevokeReward = async (rewardId) => {
    try {
      await revokeReward(rewardId, user.id, 'Revocada por administrador');
      toast({
        title: "Recompensa Revocada",
        description: "La recompensa ha sido revocada exitosamente",
      });
    } catch (error) {
      console.error('Error revoking reward:', error);
      toast({
        title: "Error",
        description: "No se pudo revocar la recompensa",
        variant: "destructive",
      });
    }
  };

  // Recargar TOP 20
  const handleRefreshTop20 = async () => {
    setLoadingTop20(true);
    try {
      const top20 = await getTop20ActiveUsers();
      setTop20Users(top20);
      toast({
        title: "TOP 20 Actualizado",
        description: "La lista se ha recargado exitosamente",
      });
    } catch (error) {
      console.error('Error refreshing TOP 20:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el TOP 20",
        variant: "destructive",
      });
    } finally {
      setLoadingTop20(false);
    }
  };

  // Handler para exportar datos a CSV
  const handleExportToCSV = () => {
    try {
      const csv = exportToCSV(historicalStats, analyticsStats);
      downloadCSV(csv);
      toast({
        title: "Exportación Exitosa",
        description: "Los datos se han descargado en formato CSV",
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: "Error al Exportar",
        description: "No se pudo generar el archivo CSV",
        variant: "destructive",
      });
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
      case 'reviewed':
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
      case 'reviewed':
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
            {/* Botón: Cambiar a Identidad Genérica */}
            {!user?._isUsingGenericIdentity && (
              <Button
                onClick={switchToGenericIdentity}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
              >
                <User className="w-4 h-4 mr-2" />
                Cambiar a Usuario Genérico
              </Button>
            )}

            <div className="glass-effect px-4 py-2 rounded-full border border-purple-500/30">
              <Shield className="w-5 h-5 text-purple-400 inline mr-2" />
              <span className="text-sm font-semibold">Administrador</span>
            </div>
          </div>
        </div>

        {/* Botón Flotante para Restaurar Identidad */}
        <RestoreIdentityButton />

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
          <TabsList className="flex flex-wrap gap-1 p-1 h-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Reportes</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="sanctions">Sanciones</TabsTrigger>
            <TabsTrigger value="rewards">Recompensas</TabsTrigger>
            <TabsTrigger value="forum">Foro</TabsTrigger>
            <TabsTrigger value="opin">OPIN estables</TabsTrigger>
            <TabsTrigger value="opin-replies">Responder OPINs</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="moderation">Moderación</TabsTrigger>
            <TabsTrigger value="generator">Generador</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* 🚨 Alertas Inteligentes */}
            <SmartAlertsPanel
              analyticsStats={analyticsStats}
              yesterdayStats={yesterdayStats}
              reportStats={reportStats}
              ticketStats={ticketStats}
              sanctionStats={sanctionStats}
            />

            {/* Estadísticas Principales - Analytics con Comparaciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <KPICard
                  icon={Eye}
                  value={analyticsStats.pageViews.toLocaleString()}
                  label="Visualizaciones Hoy"
                  change={calculatePercentageChange(analyticsStats.pageViews, yesterdayStats.pageViews)}
                  color="blue"
                  trendData={historicalStats.slice(-7).map(d => ({ value: d.pageViews || 0 }))}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SegmentedKPICard
                  icon={UserPlus}
                  value={analyticsStats.registrations}
                  label="Registros Hoy"
                  change={calculatePercentageChange(analyticsStats.registrations, yesterdayStats.registrations)}
                  color="green"
                  trendData={historicalStats.slice(-7).map(d => ({ value: d.registrations || 0 }))}
                  eventType="registrations"
                  showSegmentation={true}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <SegmentedKPICard
                  icon={LogIn}
                  value={analyticsStats.logins}
                  label="Logins Hoy"
                  change={calculatePercentageChange(analyticsStats.logins, yesterdayStats.logins)}
                  color="purple"
                  trendData={historicalStats.slice(-7).map(d => ({ value: d.logins || 0 }))}
                  eventType="logins"
                  showSegmentation={true}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <SegmentedKPICard
                  icon={MessageSquare}
                  value={analyticsStats.messagesSent}
                  label="Mensajes Enviados"
                  change={calculatePercentageChange(analyticsStats.messagesSent, yesterdayStats.messagesSent)}
                  color="cyan"
                  trendData={historicalStats.slice(-7).map(d => ({ value: d.messagesSent || 0 }))}
                  eventType="messagesSent"
                  showSegmentation={true}
                />
              </motion.div>
            </div>

            {/* Estadísticas Secundarias */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

              {/* Usuarios Activos en Tiempo Real */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <ActiveUsersCounter />
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

            {/* Análisis de Tiempo en Sitio */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <TimeDistributionChart />
            </motion.div>

            {/* Fuentes de Tráfico */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              <TrafficSourcesChart />
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

                          {(report.status === 'pending' || report.status === 'open') && (
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
                  <Button
                    onClick={() => navigate('/admin/tickets')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
                  >
                    <Ticket className="w-4 h-4 mr-2" />
                    Ir al Sistema Completo de Tickets
                  </Button>
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

              {/* Buscador de Usuarios para Sancionar */}
              <div className="mb-6 glass-effect p-6 rounded-xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/10">
                <h3 className="text-xl font-bold mb-4">
                  Buscar Usuario para Sancionar
                </h3>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar por ID de usuario o nombre de usuario..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUserSearch();
                        }
                      }}
                      className="bg-background border-2 border-input focus:border-red-400"
                    />
                  </div>
                  <Button
                    onClick={handleUserSearch}
                    disabled={searchingUsers || !userSearchTerm.trim()}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold"
                  >
                    {searchingUsers ? (
                      'Buscando...'
                    ) : (
                      'Buscar'
                    )}
                  </Button>
                </div>

                {/* Resultados de búsqueda */}
                {userSearchResults.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                    <p className="text-sm text-muted-foreground mb-2">
                      {userSearchResults.length} usuario(s) encontrado(s):
                    </p>
                    {userSearchResults.map((foundUser) => (
                      <div
                        key={foundUser.id}
                        className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:border-red-500/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={foundUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${foundUser.username}`}
                            alt={foundUser.username}
                            className="w-10 h-10 rounded-full border-2 border-border"
                          />
                          <div>
                            <p className="font-semibold">{foundUser.username}</p>
                            <p className="text-xs text-muted-foreground">ID: {foundUser.id}</p>
                            {foundUser.email && (
                              <p className="text-xs text-muted-foreground">{foundUser.email}</p>
                            )}
                            {foundUser.isBanned && (
                              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 mt-1">
                                YA BANEADO
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleSelectUserForSanction(foundUser)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Aplicar Sanción
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {userSearchResults.length === 0 && userSearchTerm && !searchingUsers && (
                  <div className="mt-4 text-center py-8 bg-background rounded-lg border border-border">
                    <p className="text-muted-foreground">
                      No se encontraron usuarios con "{userSearchTerm}"
                    </p>
                  </div>
                )}
              </div>

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

          {/* Recompensas Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-2xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Gift className="w-6 h-6 text-green-400" />
                  Sistema de Recompensas
                </h2>
                <Button
                  variant="outline"
                  onClick={handleRefreshTop20}
                  disabled={loadingTop20}
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Actualizar TOP 20
                </Button>
              </div>

              {/* Estadísticas de Recompensas */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <div className="glass-effect p-4 rounded-lg border border-border">
                  <div className="text-2xl font-bold mb-1">{rewardStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="glass-effect p-4 rounded-lg border border-green-500/30">
                  <div className="text-2xl font-bold mb-1 text-green-400">{rewardStats.active}</div>
                  <div className="text-xs text-muted-foreground">Activas</div>
                </div>
                <div className="glass-effect p-4 rounded-lg border border-yellow-500/30">
                  <div className="text-2xl font-bold mb-1 text-yellow-400">{rewardStats.premium}</div>
                  <div className="text-xs text-muted-foreground">Premium</div>
                </div>
                <div className="glass-effect p-4 rounded-lg border border-blue-500/30">
                  <div className="text-2xl font-bold mb-1 text-blue-400">{rewardStats.verified}</div>
                  <div className="text-xs text-muted-foreground">Verificados</div>
                </div>
                <div className="glass-effect p-4 rounded-lg border border-purple-500/30">
                  <div className="text-2xl font-bold mb-1 text-purple-400">{rewardStats.specialAvatar}</div>
                  <div className="text-xs text-muted-foreground">Avatares</div>
                </div>
                <div className="glass-effect p-4 rounded-lg border border-pink-500/30">
                  <div className="text-2xl font-bold mb-1 text-pink-400">{rewardStats.featured}</div>
                  <div className="text-xs text-muted-foreground">Destacados</div>
                </div>
              </div>

              {/* TOP 20 Usuarios Más Activos */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  TOP 20 Usuarios Más Activos
                </h3>
                
                {loadingTop20 ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando TOP 20...</p>
                  </div>
                ) : top20Users.length === 0 ? (
                  <div className="text-center py-12 glass-effect rounded-xl border">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay usuarios activos aún</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">#</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Usuario</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Mensajes</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Threads</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Respuestas</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Tiempo Activo</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Score</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {top20Users.map((topUser, index) => (
                          <motion.tr
                            key={topUser.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="border-b border-border hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold text-sm">
                                {index + 1}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={topUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topUser.username}`}
                                  alt={topUser.username}
                                  className="w-10 h-10 rounded-full border-2 border-border"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{topUser.username}</span>
                                    {topUser.isPremium && <Crown className="w-4 h-4 text-yellow-400" />}
                                    {topUser.verified && <Shield className="w-4 h-4 text-blue-400" />}
                                  </div>
                                  <p className="text-xs text-muted-foreground">ID: {topUser.id.slice(0, 8)}...</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm">{topUser.metrics.messagesCount || 0}</td>
                            <td className="py-4 px-4 text-sm">{topUser.metrics.threadsCount || 0}</td>
                            <td className="py-4 px-4 text-sm">{topUser.metrics.repliesCount || 0}</td>
                            <td className="py-4 px-4 text-sm">{topUser.metrics.totalActiveTime || 0} min</td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
                                {topUser.metrics.activityScore || 0}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <Button
                                size="sm"
                                onClick={() => handleSelectUserForReward(topUser)}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                              >
                                <Gift className="w-4 h-4 mr-1" />
                                Premiar
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Lista de Recompensas Otorgadas */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-400" />
                  Recompensas Otorgadas
                </h3>
                
                {rewards.length === 0 ? (
                  <div className="text-center py-12 glass-effect rounded-xl border">
                    <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay recompensas registradas</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rewards.slice(0, 50).map((reward, index) => (
                      <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="glass-effect p-5 rounded-xl border border-border hover:border-green-500/50 transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {reward.type === REWARD_TYPES.PREMIUM_1_MONTH && <Crown className="w-6 h-6 text-yellow-400" />}
                              {reward.type === REWARD_TYPES.VERIFIED_1_MONTH && <Shield className="w-6 h-6 text-blue-400" />}
                              {reward.type === REWARD_TYPES.SPECIAL_AVATAR && <Star className="w-6 h-6 text-purple-400" />}
                              {reward.type === REWARD_TYPES.FEATURED_USER && <Award className="w-6 h-6 text-pink-400" />}
                              {reward.type === REWARD_TYPES.MODERATOR_1_MONTH && <Shield className="w-6 h-6 text-cyan-400" />}
                              <div>
                                <h3 className="font-semibold text-lg">{reward.username}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {reward.type === REWARD_TYPES.PREMIUM_1_MONTH && 'Premium 1 Mes'}
                                  {reward.type === REWARD_TYPES.VERIFIED_1_MONTH && 'Verificación 1 Mes'}
                                  {reward.type === REWARD_TYPES.SPECIAL_AVATAR && 'Avatar Especial 1 Mes'}
                                  {reward.type === REWARD_TYPES.FEATURED_USER && 'Usuario Destacado'}
                                  {reward.type === REWARD_TYPES.MODERATOR_1_MONTH && 'Moderador 1 Mes'}
                                </p>
                              </div>
                            </div>
                            {reward.reasonDescription && (
                              <p className="text-sm text-muted-foreground mb-2 pl-9">
                                {reward.reasonDescription}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground pl-9">
                              <span>Otorgado por: {reward.issuedByUsername}</span>
                              {reward.expiresAt && (
                                <>
                                  <span>•</span>
                                  <span>Expira: {new Date(reward.expiresAt).toLocaleDateString('es-CL')}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{new Date(reward.createdAt).toLocaleDateString('es-CL')}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                              reward.status === 'active' 
                                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                : reward.status === 'revoked'
                                ? 'bg-red-500/20 border-red-500/30 text-red-400'
                                : 'bg-gray-500/20 border-gray-500/30 text-gray-400'
                            }`}>
                              {reward.status === 'active' ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              <span className="text-xs font-medium capitalize">{reward.status === 'active' ? 'Activa' : reward.status === 'revoked' ? 'Revocada' : 'Expirada'}</span>
                            </div>

                            {reward.status === 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevokeReward(reward.id)}
                                className="border-red-500 text-red-400 hover:bg-red-500/20"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Revocar
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Modal de Recompensa */}
            {selectedUserToReward && (
              <RewardUserModal
                isOpen={showRewardModal}
                onClose={() => {
                  setShowRewardModal(false);
                  setSelectedUserToReward(null);
                }}
                user={selectedUserToReward}
                currentAdmin={user}
                onRewardCreated={() => {
                  // Recargar TOP 20 después de otorgar recompensa
                  handleRefreshTop20();
                }}
              />
            )}
          </TabsContent>

          {/* Foro Tab - Gestión del Foro Anónimo */}
          <TabsContent value="forum" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-2xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-cyan-400" />
                  Gestión del Foro Anónimo
                </h2>
                <Button
                  variant="outline"
                  onClick={async () => {
                    setLoadingForum(true);
                    try {
                      const [threads, replies] = await Promise.all([
                        getAllThreadsAsAdmin(),
                        getAllRepliesAsAdmin()
                      ]);
                      setForumThreads(threads);
                      setForumReplies(replies);
                      toast({
                        title: "Foro Actualizado",
                        description: `${threads.length} threads y ${replies.length} respuestas cargadas`,
                      });
                    } catch (error) {
                      console.error('Error cargando foro:', error);
                      toast({
                        title: "Error",
                        description: "No se pudieron cargar los datos del foro",
                        variant: "destructive",
                      });
                    } finally {
                      setLoadingForum(false);
                    }
                  }}
                  disabled={loadingForum}
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>

              {/* Tabs internos para Threads y Replies */}
              <Tabs defaultValue="threads" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="threads">Threads ({forumThreads.length})</TabsTrigger>
                  <TabsTrigger value="replies">Respuestas ({forumReplies.length})</TabsTrigger>
                </TabsList>

                {/* Tab de Threads */}
                <TabsContent value="threads" className="space-y-6">
                  {/* Formulario para crear/editar thread */}
                  <div className="glass-effect rounded-xl border border-border p-6">
                    <h3 className="text-xl font-bold mb-4">
                      {selectedThread ? 'Editar Thread' : 'Crear Nuevo Thread'}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Título</label>
                          <Input
                            value={forumFormData.title}
                            onChange={(e) => setForumFormData({ ...forumFormData, title: e.target.value })}
                            placeholder="Título del thread"
                            className="bg-background border-border"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Categoría</label>
                          <Select
                            value={forumFormData.category}
                            onValueChange={(value) => setForumFormData({ ...forumFormData, category: value })}
                          >
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Apoyo Emocional">Apoyo Emocional</SelectItem>
                              <SelectItem value="Recursos">Recursos</SelectItem>
                              <SelectItem value="Experiencias">Experiencias</SelectItem>
                              <SelectItem value="Preguntas">Preguntas</SelectItem>
                              <SelectItem value="Logros">Logros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Contenido</label>
                        <Textarea
                          value={forumFormData.content}
                          onChange={(e) => setForumFormData({ ...forumFormData, content: e.target.value })}
                          placeholder="Contenido del thread"
                          className="bg-background border-border min-h-[120px]"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="text-sm font-medium mb-2 block">ID Anónimo (opcional)</label>
                          <div className="flex gap-2">
                            <Input
                              value={forumFormData.anonymousId}
                              onChange={(e) => setForumFormData({ ...forumFormData, anonymousId: e.target.value })}
                              placeholder="anon_123456"
                              className="bg-background border-border"
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                const newId = `anon_${Math.floor(Math.random() * 1000000)}`;
                                setForumFormData({ ...forumFormData, anonymousId: newId });
                              }}
                              size="sm"
                            >
                              Generar ID
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={async () => {
                            if (!forumFormData.title || !forumFormData.content) {
                              toast({
                                title: "Campos Incompletos",
                                description: "Debes completar el título y el contenido",
                                variant: "destructive",
                              });
                              return;
                            }
                            try {
                              if (selectedThread) {
                                await updateThreadAsAdmin(selectedThread.id, {
                                  title: forumFormData.title,
                                  content: forumFormData.content,
                                  category: forumFormData.category,
                                });
                                toast({
                                  title: "Thread Actualizado",
                                  description: "El thread ha sido actualizado exitosamente",
                                });
                              } else {
                                await createThreadAsAdmin(
                                  {
                                    title: forumFormData.title,
                                    content: forumFormData.content,
                                    category: forumFormData.category,
                                  },
                                  forumFormData.anonymousId || null
                                );
                                toast({
                                  title: "Thread Creado",
                                  description: "El thread ha sido creado exitosamente",
                                });
                              }
                              // Recargar threads
                              const threads = await getAllThreadsAsAdmin();
                              setForumThreads(threads);
                              // Limpiar formulario
                              setForumFormData({
                                title: '',
                                content: '',
                                category: 'Preguntas',
                                anonymousId: '',
                                threadId: '',
                              });
                              setSelectedThread(null);
                            } catch (error) {
                              console.error('Error:', error);
                              toast({
                                title: "Error",
                                description: "No se pudo guardar el thread",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white"
                        >
                          {selectedThread ? 'Actualizar Thread' : 'Crear Thread'}
                        </Button>
                        {selectedThread && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedThread(null);
                              setForumFormData({
                                title: '',
                                content: '',
                                category: 'Preguntas',
                                anonymousId: '',
                                threadId: '',
                              });
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lista de threads */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Threads Existentes</h3>
                    {loadingForum ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent mx-auto"></div>
                      </div>
                    ) : forumThreads.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay threads. Crea uno nuevo arriba.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {forumThreads.map((thread) => (
                          <div
                            key={thread.id}
                            className="glass-effect rounded-lg border border-border p-4 hover:border-cyan-500/50 transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-bold text-foreground">{thread.title}</h4>
                                  <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                    {thread.category}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{thread.content}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>👤 {thread.authorDisplay}</span>
                                  <span>💬 {thread.replies || 0} respuestas</span>
                                  <span>❤️ {thread.likes || 0} likes</span>
                                  <span>👁️ {thread.views || 0} vistas</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedThread(thread);
                                    setForumFormData({
                                      title: thread.title,
                                      content: thread.content,
                                      category: thread.category,
                                      anonymousId: thread.authorId,
                                      threadId: thread.id,
                                    });
                                  }}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    if (confirm('¿Estás seguro de eliminar este thread? También se eliminarán todas sus respuestas.')) {
                                      try {
                                        await deleteThreadAsAdmin(thread.id);
                                        toast({
                                          title: "Thread Eliminado",
                                          description: "El thread y sus respuestas han sido eliminados",
                                        });
                                        const threads = await getAllThreadsAsAdmin();
                                        setForumThreads(threads);
                                      } catch (error) {
                                        console.error('Error:', error);
                                        toast({
                                          title: "Error",
                                          description: "No se pudo eliminar el thread",
                                          variant: "destructive",
                                        });
                                      }
                                    }
                                  }}
                                  className="text-red-400 hover:text-red-500"
                                >
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab de Replies */}
                <TabsContent value="replies" className="space-y-6">
                  {/* Formulario para crear/editar reply */}
                  <div className="glass-effect rounded-xl border border-border p-6">
                    <h3 className="text-xl font-bold mb-4">
                      {selectedReply ? 'Editar Respuesta' : 'Crear Nueva Respuesta'}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Thread ID</label>
                        <div className="flex gap-2">
                          <Input
                            value={forumFormData.threadId}
                            onChange={(e) => setForumFormData({ ...forumFormData, threadId: e.target.value })}
                            placeholder="ID del thread al que responder"
                            className="bg-background border-border flex-1"
                          />
                          <Select
                            value={forumFormData.threadId}
                            onValueChange={(value) => setForumFormData({ ...forumFormData, threadId: value })}
                          >
                            <SelectTrigger className="bg-background border-border w-64">
                              <SelectValue placeholder="Seleccionar thread" />
                            </SelectTrigger>
                            <SelectContent>
                              {forumThreads.map((thread) => (
                                <SelectItem key={thread.id} value={thread.id}>
                                  {thread.title.substring(0, 40)}...
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Contenido de la Respuesta</label>
                        <Textarea
                          value={forumFormData.content}
                          onChange={(e) => setForumFormData({ ...forumFormData, content: e.target.value })}
                          placeholder="Escribe tu respuesta aquí"
                          className="bg-background border-border min-h-[120px]"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="text-sm font-medium mb-2 block">ID Anónimo (opcional)</label>
                          <div className="flex gap-2">
                            <Input
                              value={forumFormData.anonymousId}
                              onChange={(e) => setForumFormData({ ...forumFormData, anonymousId: e.target.value })}
                              placeholder="anon_123456"
                              className="bg-background border-border"
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                const newId = `anon_${Math.floor(Math.random() * 1000000)}`;
                                setForumFormData({ ...forumFormData, anonymousId: newId });
                              }}
                              size="sm"
                            >
                              Generar ID
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={async () => {
                            if (!forumFormData.threadId || !forumFormData.content) {
                              toast({
                                title: "Campos Incompletos",
                                description: "Debes completar el Thread ID y el contenido",
                                variant: "destructive",
                              });
                              return;
                            }
                            try {
                              if (selectedReply) {
                                await updateReplyAsAdmin(selectedReply.id, {
                                  content: forumFormData.content,
                                });
                                toast({
                                  title: "Respuesta Actualizada",
                                  description: "La respuesta ha sido actualizada exitosamente",
                                });
                              } else {
                                await addReplyAsAdmin(
                                  forumFormData.threadId,
                                  forumFormData.content,
                                  forumFormData.anonymousId || null
                                );
                                toast({
                                  title: "Respuesta Creada",
                                  description: "La respuesta ha sido creada exitosamente",
                                });
                              }
                              // Recargar replies
                              const replies = await getAllRepliesAsAdmin();
                              setForumReplies(replies);
                              // Limpiar formulario
                              setForumFormData({
                                title: '',
                                content: '',
                                category: 'Preguntas',
                                anonymousId: '',
                                threadId: '',
                              });
                              setSelectedReply(null);
                            } catch (error) {
                              console.error('Error:', error);
                              toast({
                                title: "Error",
                                description: "No se pudo guardar la respuesta",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="bg-purple-500 hover:bg-purple-600 text-white"
                        >
                          {selectedReply ? 'Actualizar Respuesta' : 'Crear Respuesta'}
                        </Button>
                        {selectedReply && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedReply(null);
                              setForumFormData({
                                title: '',
                                content: '',
                                category: 'Preguntas',
                                anonymousId: '',
                                threadId: '',
                              });
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lista de replies */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Respuestas Existentes</h3>
                    {loadingForum ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400 border-t-transparent mx-auto"></div>
                      </div>
                    ) : forumReplies.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay respuestas. Crea una nueva arriba.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {forumReplies.map((reply) => {
                          const thread = forumThreads.find(t => t.id === reply.threadId);
                          return (
                            <div
                              key={reply.id}
                              className="glass-effect rounded-lg border border-border p-4 hover:border-purple-500/50 transition-all"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-muted-foreground">Thread: {thread?.title || reply.threadId}</span>
                                  </div>
                                  <p className="text-sm text-foreground mb-2">{reply.content}</p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>👤 {reply.authorDisplay}</span>
                                    <span>❤️ {reply.likes || 0} likes</span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedReply(reply);
                                      setForumFormData({
                                        title: '',
                                        content: reply.content,
                                        category: 'Preguntas',
                                        anonymousId: reply.authorId,
                                        threadId: reply.threadId,
                                      });
                                    }}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      if (confirm('¿Estás seguro de eliminar esta respuesta?')) {
                                        try {
                                          await deleteReplyAsAdmin(reply.id, reply.threadId);
                                          toast({
                                            title: "Respuesta Eliminada",
                                            description: "La respuesta ha sido eliminada",
                                          });
                                          const replies = await getAllRepliesAsAdmin();
                                          setForumReplies(replies);
                                        } catch (error) {
                                          console.error('Error:', error);
                                          toast({
                                            title: "Error",
                                            description: "No se pudo eliminar la respuesta",
                                            variant: "destructive",
                                          });
                                        }
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-500"
                                  >
                                    Eliminar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </TabsContent>

          {/* OPIN estables Tab */}
          <TabsContent value="opin" className="space-y-6">
            <OpinStablesPanel />
          </TabsContent>

          {/* Responder OPINs Tab */}
          <TabsContent value="opin-replies" className="space-y-6">
            <AdminOpinRepliesPanel />
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
                      onValueChange={(value) => {
                        setNotificationForm({ ...notificationForm, type: value });
                        // Resetear campos de actualización si cambia el tipo
                        if (value !== NOTIFICATION_TYPES.UPDATE) {
                          setUpdateVersion('');
                          setExtraExplanation('');
                        }
                      }}
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

                  {/* ⚡ NUEVO: Destinatarios */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Destinatarios</label>
                    <Select
                      value={notificationForm.targetAudience}
                      onValueChange={(value) => setNotificationForm({ ...notificationForm, targetAudience: value })}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">👥 Todos los usuarios</SelectItem>
                        <SelectItem value="registered">🔐 Solo usuarios registrados</SelectItem>
                        <SelectItem value="guests">👤 Solo invitados</SelectItem>
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

                {/* Campos especiales para Actualización */}
                {notificationForm.type === NOTIFICATION_TYPES.UPDATE && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Versión <span className="text-cyan-400">*</span>
                      </label>
                      <Input
                        value={updateVersion}
                        onChange={(e) => setUpdateVersion(e.target.value)}
                        placeholder="1.2.3"
                        className="bg-background border-border"
                        maxLength={20}
                      />
                      <p className="text-xs text-muted-foreground">
                        Solo puedes editar la versión
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Explicación Extra (Opcional)
                      </label>
                      <Textarea
                        value={extraExplanation}
                        onChange={(e) => setExtraExplanation(e.target.value)}
                        placeholder="Ej: Mejoras en rendimiento, nuevas funciones de chat, correcciones de bugs..."
                        className="bg-background border-border min-h-[80px]"
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {extraExplanation.length}/200 caracteres
                      </p>
                    </div>
                  </div>
                )}

                {/* Título */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Título de la Notificación</label>
                  <Input
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                    placeholder="¡Nueva actualización disponible!"
                    className="bg-background border-border"
                    maxLength={100}
                    disabled={notificationForm.type === NOTIFICATION_TYPES.UPDATE}
                  />
                  {notificationForm.type === NOTIFICATION_TYPES.UPDATE && (
                    <p className="text-xs text-muted-foreground">
                      El título se genera automáticamente con la versión
                    </p>
                  )}
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
                    disabled={notificationForm.type === NOTIFICATION_TYPES.UPDATE}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {notificationForm.message.length}/500 caracteres
                  </p>
                  {notificationForm.type === NOTIFICATION_TYPES.UPDATE && (
                    <p className="text-xs text-cyan-400">
                      El mensaje se genera automáticamente con la versión y explicación extra
                    </p>
                  )}
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
                    Esta notificación se enviará a{' '}
                    <strong>
                      {notificationForm.targetAudience === 'all' && '👥 TODOS los usuarios (registrados e invitados)'}
                      {notificationForm.targetAudience === 'registered' && '🔐 Solo usuarios REGISTRADOS'}
                      {notificationForm.targetAudience === 'guests' && '👤 Solo usuarios INVITADOS'}
                    </strong>
                  </p>
                  <Button
                    onClick={async () => {
                      // Validación especial para actualizaciones
                      if (notificationForm.type === NOTIFICATION_TYPES.UPDATE) {
                        if (!updateVersion) {
                          toast({
                            title: "Campo Requerido",
                            description: "Debes ingresar la versión de la actualización",
                            variant: "destructive",
                          });
                          return;
                        }
                      }
                      
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
                          targetAudience: 'all', // ⚡ Resetear a 'all'
                        });
                        setUpdateVersion('');
                        setExtraExplanation('');
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
                    disabled={
                      isSendingNotification || 
                      !notificationForm.title || 
                      !notificationForm.message ||
                      (notificationForm.type === NOTIFICATION_TYPES.UPDATE && !updateVersion)
                    }
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

          {/* Analytics Tab - Mejorado con Gráficos */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Header con botón de exportar */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Análisis Detallado</h2>
                <p className="text-sm text-muted-foreground">Métricas avanzadas y tendencias</p>
              </div>
              <Button
                onClick={handleExportToCSV}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar a CSV
              </Button>
            </div>

            {/* KPIs Calculados */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect p-6 rounded-2xl border border-green-500/30"
              >
                <h4 className="text-sm text-muted-foreground mb-2">Tasa de Conversión</h4>
                <h3 className="text-3xl font-bold text-green-400 mb-1">
                  {analyticsStats.pageViews > 0
                    ? ((analyticsStats.registrations / analyticsStats.pageViews) * 100).toFixed(1)
                    : '0.0'}%
                </h3>
                <p className="text-xs text-muted-foreground">
                  {analyticsStats.registrations} de {analyticsStats.pageViews} visitantes
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-effect p-6 rounded-2xl border border-blue-500/30"
              >
                <h4 className="text-sm text-muted-foreground mb-2">Tasa de Activación</h4>
                <h3 className="text-3xl font-bold text-blue-400 mb-1">
                  {analyticsStats.registrations > 0
                    ? ((analyticsStats.messagesSent / analyticsStats.registrations) * 100).toFixed(1)
                    : '0.0'}%
                </h3>
                <p className="text-xs text-muted-foreground">
                  Usuarios que envían mensajes
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-effect p-6 rounded-2xl border border-yellow-500/30"
              >
                <h4 className="text-sm text-muted-foreground mb-2">Bounce Rate</h4>
                <h3 className="text-3xl font-bold text-yellow-400 mb-1">
                  {analyticsStats.pageViews > 0
                    ? ((analyticsStats.pageExits / analyticsStats.pageViews) * 100).toFixed(1)
                    : '0.0'}%
                </h3>
                <p className="text-xs text-muted-foreground">
                  Visitantes que salen
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-effect p-6 rounded-2xl border border-purple-500/30"
              >
                <h4 className="text-sm text-muted-foreground mb-2">Engagement</h4>
                <h3 className="text-3xl font-bold text-purple-400 mb-1">
                  {analyticsStats.logins > 0
                    ? (analyticsStats.messagesSent / analyticsStats.logins).toFixed(1)
                    : '0.0'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Mensajes promedio por usuario
                </p>
              </motion.div>
            </div>

            {/* Gráficos de Tendencias */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-effect rounded-2xl border border-border p-6"
              >
                <TrendLineChart
                  data={historicalStats}
                  dataKeys={[
                    { key: 'pageViews', name: 'Visualizaciones' },
                    { key: 'registrations', name: 'Registros' }
                  ]}
                  colors={['#60a5fa', '#4ade80']}
                  title="Tráfico y Conversión - Últimos 7 días"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-effect rounded-2xl border border-border p-6"
              >
                <TrendLineChart
                  data={historicalStats}
                  dataKeys={[
                    { key: 'logins', name: 'Logins' },
                    { key: 'messagesSent', name: 'Mensajes' }
                  ]}
                  colors={['#c084fc', '#22d3ee']}
                  title="Actividad de Usuarios - Últimos 7 días"
                />
              </motion.div>
            </div>

            {/* Gráfico de Barras Comparativo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-2xl border border-border p-6"
            >
              <ComparisonBarChart
                data={historicalStats}
                dataKeys={[
                  { key: 'registrations', name: 'Registros' },
                  { key: 'logins', name: 'Logins' },
                  { key: 'messagesSent', name: 'Mensajes' }
                ]}
                colors={['#4ade80', '#c084fc', '#22d3ee']}
                title="Comparativa Diaria - Últimos 7 días"
              />
            </motion.div>

            {/* Tabla de Datos Históricos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-effect rounded-2xl border border-border p-6"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                Datos Históricos Detallados
              </h2>
              {historicalStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm text-muted-foreground">Fecha</th>
                        <th className="text-right p-3 text-sm text-muted-foreground">Vistas</th>
                        <th className="text-right p-3 text-sm text-muted-foreground">Registros</th>
                        <th className="text-right p-3 text-sm text-muted-foreground">Logins</th>
                        <th className="text-right p-3 text-sm text-muted-foreground">Mensajes</th>
                        <th className="text-right p-3 text-sm text-muted-foreground">Conv. %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicalStats.map((day) => (
                        <tr key={day.date} className="border-b border-border/50 hover:bg-background/50">
                          <td className="p-3 text-sm">
                            {new Date(day.date).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </td>
                          <td className="text-right p-3 font-medium">{day.pageViews || 0}</td>
                          <td className="text-right p-3 font-medium text-green-400">{day.registrations || 0}</td>
                          <td className="text-right p-3 font-medium text-purple-400">{day.logins || 0}</td>
                          <td className="text-right p-3 font-medium text-cyan-400">{day.messagesSent || 0}</td>
                          <td className="text-right p-3 font-medium text-yellow-400">
                            {day.pageViews > 0
                              ? ((day.registrations / day.pageViews) * 100).toFixed(1)
                              : '0.0'}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No hay datos históricos disponibles aún</p>
              )}
            </motion.div>
          </TabsContent>

          {/* Moderación Tab */}
          <TabsContent value="moderation" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-purple-400" />
                  Sistema de Moderación
                </h2>
                <p className="text-sm text-muted-foreground">
                  Alertas automáticas de contenido sensible detectadas por ChatGPT
                </p>
              </div>
              <ModerationAlerts />
            </motion.div>
          </TabsContent>

          {/* Generador de Mensajes */}
          <TabsContent value="generator" className="space-y-6">
            <MessageGenerator />
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
