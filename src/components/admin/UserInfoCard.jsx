import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUserInfo } from '@/services/adminService';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Hash,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * COMPONENTE: UserInfoCard
 *
 * Tarjeta con información del usuario que creó el ticket
 * Muestra datos relevantes para el soporte
 *
 * Props:
 * - userId: UID del usuario
 * - compact: Versión compacta (default: false)
 */
const UserInfoCard = ({ userId, compact = false }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUserInfo(userId);
        setUserInfo(data);
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserInfo();
    }
  }, [userId]);

  if (loading) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <CardContent className={compact ? 'p-0' : 'pt-6'}>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <CardContent className={compact ? 'p-0' : 'pt-6'}>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Error al cargar usuario</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userInfo) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <CardContent className={compact ? 'p-0' : 'pt-6'}>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Usuario no encontrado</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRoleBadge = (role) => {
    const configs = {
      admin: { label: 'Admin', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
      support: { label: 'Soporte', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
      user: { label: 'Usuario', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300' }
    };
    const config = configs[role] || configs.user;
    return <Badge className={`${config.color} text-xs`}>{config.label}</Badge>;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch {
      return 'N/A';
    }
  };

  if (compact) {
    return (
      <Card className="bg-gray-50 dark:bg-gray-900/30">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-sm">{userInfo.username || 'Sin username'}</span>
              {getRoleBadge(userInfo.role)}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">{userInfo.email || 'Sin email'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Hash className="w-3.5 h-3.5" />
              <span className="font-mono truncate">{userId}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Información del Usuario</CardTitle>
          {getRoleBadge(userInfo.role)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Username */}
        <div className="flex items-start gap-3">
          <User className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Username</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
              {userInfo.username || 'Sin username'}
            </p>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start gap-3">
          <Mail className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
              {userInfo.email || 'Sin email'}
            </p>
          </div>
        </div>

        {/* User ID */}
        <div className="flex items-start gap-3">
          <Hash className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
            <p className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate">
              {userId}
            </p>
          </div>
        </div>

        {/* Account created */}
        <div className="flex items-start gap-3">
          <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Cuenta creada</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {formatDate(userInfo.createdAt)}
            </p>
          </div>
        </div>

        {/* Role */}
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Rol</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 capitalize">
              {userInfo.role || 'user'}
            </p>
          </div>
        </div>

        {/* Guest message count if applicable */}
        {userInfo.guestMessageCount !== undefined && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Mensajes (invitado)</span>
              <Badge variant="outline" className="text-xs">
                {userInfo.guestMessageCount} / {userInfo.maxGuestMessages || 10}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserInfoCard;
