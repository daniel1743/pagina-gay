import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Filter,
  SlidersHorizontal,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import {
  subscribeToTickets,
  searchTickets,
  getTicketStats,
  TICKET_STATUS,
  TICKET_PRIORITY,
  TICKET_CATEGORY
} from '@/services/ticketService';
import { checkUserRole } from '@/services/adminService';
import TicketStatusBadge from '@/components/admin/TicketStatusBadge';
import PriorityPill from '@/components/admin/PriorityPill';

/**
 * PÁGINA: AdminTicketsPage
 *
 * Panel de administración de tickets con:
 * - Búsqueda avanzada (ticketId, username, uid, categoría)
 * - Filtros (estado, categoría, prioridad, asignación)
 * - Ordenamiento
 * - Estadísticas en tiempo real
 * - Vista de lista/tabla
 * - Navegación a detalle
 */
const AdminTicketsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados de permisos
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Tickets data
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt_desc'); // createdAt_desc, createdAt_asc, priority_desc, etc

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    waiting_user: 0,
    resolved: 0,
    closed: 0
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);

  // Verificar permisos de admin/support
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
          console.log('🎉 Super Admin detectado - Acceso garantizado');
          setIsAuthorized(true);
          setLoading(false);
          return;
        }

        // Verificar rol desde Firestore
        const roleCheck = await checkUserRole(user.id);

        if (roleCheck.isAdmin || roleCheck.isSupport) {
          setIsAuthorized(true);
        } else {
          toast({
            title: "Acceso Denegado",
            description: "No tienes permisos para acceder al panel de tickets",
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
          setIsAuthorized(true);
        } else {
          toast({
            title: "Error",
            description: "No se pudo verificar tus permisos",
            variant: "destructive",
          });
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [user, navigate]);

  // Suscribirse a todos los tickets
  useEffect(() => {
    if (!isAuthorized) return;

    const unsubscribe = subscribeToTickets((ticketsData) => {
      setTickets(ticketsData);
      applyFiltersAndSort(ticketsData, searchTerm, statusFilter, categoryFilter, priorityFilter, sortBy);
    });

    return () => unsubscribe();
  }, [isAuthorized]);

  // Cargar estadísticas
  useEffect(() => {
    if (!isAuthorized) return;

    const loadStats = async () => {
      try {
        const ticketStats = await getTicketStats();
        setStats(ticketStats);
      } catch (error) {
        console.error('Error loading ticket stats:', error);
      }
    };

    loadStats();

    // Actualizar stats cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [isAuthorized]);

  // Aplicar filtros y ordenamiento
  const applyFiltersAndSort = (
    ticketsData,
    search,
    status,
    category,
    priority,
    sort
  ) => {
    let filtered = [...ticketsData];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.id.toLowerCase().includes(searchLower) ||
        ticket.username?.toLowerCase().includes(searchLower) ||
        ticket.userUid?.toLowerCase().includes(searchLower) ||
        ticket.subject?.toLowerCase().includes(searchLower) ||
        ticket.description?.toLowerCase().includes(searchLower) ||
        ticket.category?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === status);
    }

    // Category filter
    if (category !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === category);
    }

    // Priority filter
    if (priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priority);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sort) {
        case 'createdAt_desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'createdAt_asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'priority_desc':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'priority_asc':
          const priorityOrderAsc = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrderAsc[a.priority] || 0) - (priorityOrderAsc[b.priority] || 0);
        case 'updatedAt_desc':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        default:
          return 0;
      }
    });

    setFilteredTickets(filtered);
  };

  // Effect para aplicar filtros cuando cambian
  useEffect(() => {
    applyFiltersAndSort(tickets, searchTerm, statusFilter, categoryFilter, priorityFilter, sortBy);
  }, [tickets, searchTerm, statusFilter, categoryFilter, priorityFilter, sortBy]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  // Handle filters reset
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSortBy('createdAt_desc');
  };

  // Navigate to ticket detail
  const handleTicketClick = (ticketId) => {
    navigate(`/admin/tickets/${ticketId}`);
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
              onClick={() => navigate('/admin')}
              className="text-purple-300 hover:text-purple-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Panel
            </Button>
          </div>
        </div>

        {/* Título */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Sistema de Tickets
          </h1>
          <p className="text-muted-foreground">
            Gestiona todas las solicitudes de soporte de forma eficiente
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/30">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-300">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-400">{stats.open}</div>
                <div className="text-xs text-muted-foreground">Abiertos</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-400">{stats.in_progress}</div>
                <div className="text-xs text-muted-foreground">En Progreso</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-400">{stats.waiting_user}</div>
                <div className="text-xs text-muted-foreground">Esperando</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
                <div className="text-xs text-muted-foreground">Resueltos</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/30">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-400">{stats.closed}</div>
                <div className="text-xs text-muted-foreground">Cerrados</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filters Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* Search bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ID, username, categoría, descripción..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </Button>

              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Limpiar
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border"
              >
                {/* Status filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Estado</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value={TICKET_STATUS.OPEN}>Abierto</SelectItem>
                      <SelectItem value={TICKET_STATUS.IN_PROGRESS}>En Progreso</SelectItem>
                      <SelectItem value={TICKET_STATUS.WAITING_USER}>Esperando Usuario</SelectItem>
                      <SelectItem value={TICKET_STATUS.RESOLVED}>Resuelto</SelectItem>
                      <SelectItem value={TICKET_STATUS.CLOSED}>Cerrado</SelectItem>
                      <SelectItem value={TICKET_STATUS.SPAM}>Spam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Categoría</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      <SelectItem value={TICKET_CATEGORY.GENERAL}>General</SelectItem>
                      <SelectItem value={TICKET_CATEGORY.USERNAME_CHANGE}>Cambio de Username</SelectItem>
                      <SelectItem value={TICKET_CATEGORY.TECHNICAL}>Técnico</SelectItem>
                      <SelectItem value={TICKET_CATEGORY.BILLING}>Facturación</SelectItem>
                      <SelectItem value={TICKET_CATEGORY.BUG}>Bug</SelectItem>
                      <SelectItem value={TICKET_CATEGORY.ABUSE}>Abuso</SelectItem>
                      <SelectItem value={TICKET_CATEGORY.FEATURE}>Nueva Funcionalidad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Prioridad</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las prioridades</SelectItem>
                      <SelectItem value={TICKET_PRIORITY.URGENT}>Urgente</SelectItem>
                      <SelectItem value={TICKET_PRIORITY.HIGH}>Alta</SelectItem>
                      <SelectItem value={TICKET_PRIORITY.MEDIUM}>Media</SelectItem>
                      <SelectItem value={TICKET_PRIORITY.LOW}>Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort by */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Ordenar por</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt_desc">Más recientes primero</SelectItem>
                      <SelectItem value="createdAt_asc">Más antiguos primero</SelectItem>
                      <SelectItem value="priority_desc">Mayor prioridad primero</SelectItem>
                      <SelectItem value="priority_asc">Menor prioridad primero</SelectItem>
                      <SelectItem value="updatedAt_desc">Última actualización</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {/* Results count */}
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredTickets.length} de {tickets.length} tickets
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Filter className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">No se encontraron tickets</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'No hay tickets en el sistema'}
                </p>
              </div>
              {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all') && (
                <Button onClick={handleResetFilters} variant="outline" className="mt-4">
                  Limpiar Filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className="hover:border-purple-500/50 transition-all cursor-pointer"
                  onClick={() => handleTicketClick(ticket.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Ticket info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold truncate">
                                {ticket.subject}
                              </h3>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {ticket.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-mono">#{ticket.id.slice(0, 8)}</span>
                              <span>•</span>
                              <span>Por: <span className="text-purple-400 font-medium">{ticket.username}</span></span>
                              <span>•</span>
                              <span>{formatDate(ticket.createdAt)}</span>
                              <span>•</span>
                              <span className="capitalize">{ticket.category}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status and priority badges */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <TicketStatusBadge status={ticket.status} size="sm" />
                          <PriorityPill priority={ticket.priority} size="sm" />
                        </div>

                        {ticket.assignedTo && (
                          <div className="text-xs text-muted-foreground">
                            Asignado a: {ticket.assignedToUsername || ticket.assignedTo.slice(0, 8)}
                          </div>
                        )}

                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTicketClick(ticket.id);
                          }}
                          className="mt-2"
                        >
                          Ver Detalle
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTicketsPage;
