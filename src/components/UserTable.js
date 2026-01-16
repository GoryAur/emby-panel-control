'use client';

import { useState, useMemo, useEffect } from 'react';
import { embyService } from '@/services/emby';
import { authService } from '@/services/auth';
import {
  Search, Plus, X, Calendar, Pencil, UserX, UserCheck,
  Trash2, Square, Monitor, Cloud, SlidersHorizontal, Users, User2, RefreshCw,
  MessageSquare, AlertTriangle, MonitorX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import UserModal from './UserModal';
import { toast } from 'sonner';

export default function UserTable({ users, subscriptions, servers, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [serverFilter, setServerFilter] = useState('all');
  const [creatorFilter, setCreatorFilter] = useState('all');
  const [screenFilter, setScreenFilter] = useState('all');

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const data = await authService.getCurrentUser();
      setCurrentUser(data.user);
    } catch (err) {
      console.error(err);
    }
  };

  const getSubKey = (userId, serverId) => `${serverId}__${userId}`;

  // Unique lists for filters
  const creators = useMemo(() => {
    const list = [...new Set(users.map(u => u.creator || 'Admin'))].filter(Boolean);
    return list.sort();
  }, [users]);

  // Filter Logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesServer = serverFilter === 'all' || user.serverId === serverFilter;
      const matchesCreator = creatorFilter === 'all' || (user.creator || 'Admin') === creatorFilter;

      // Screens Logic
      const maxScreens = user.policy?.SimultaneousStreamLimit || user.simultaneousStreamLimit || 0;
      let matchesScreens = true;
      if (screenFilter !== 'all') {
        if (screenFilter === '1') matchesScreens = maxScreens === 1;
        else if (screenFilter === '3') matchesScreens = maxScreens === 3;
        else if (screenFilter === '5') matchesScreens = maxScreens >= 5;
        else if (screenFilter === 'unlimited') matchesScreens = maxScreens === 0;
      }

      let matchesStatus = true;
      if (statusFilter === 'online') matchesStatus = user.isOnline && !user.isDisabled;
      else if (statusFilter === 'offline') matchesStatus = !user.isOnline && !user.isDisabled;
      else if (statusFilter === 'disabled') matchesStatus = user.isDisabled;

      let matchesSubscription = true;
      const subKey = getSubKey(user.id, user.serverId);

      if (!user.isAdministrator && subscriptionFilter !== 'all') {
        const sub = subscriptions[subKey];
        const hasSub = sub?.expirationDate;

        if (subscriptionFilter === 'none') matchesSubscription = !hasSub;
        else if (hasSub) {
          const expDate = new Date(sub.expirationDate);
          const now = new Date();
          const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

          if (subscriptionFilter === 'active') matchesSubscription = daysLeft > 7;
          else if (subscriptionFilter === 'expiring') matchesSubscription = daysLeft >= 0 && daysLeft <= 7;
          else if (subscriptionFilter === 'expired') matchesSubscription = daysLeft < 0;
        } else {
          matchesSubscription = false;
        }
      }

      return matchesSearch && matchesServer && matchesCreator && matchesScreens && matchesStatus && matchesSubscription;
    });
  }, [users, subscriptions, searchTerm, statusFilter, subscriptionFilter, serverFilter, creatorFilter, screenFilter]);

  // Actions
  const handleToggleUser = async (userId, serverId, userName, enable) => {
    if (!confirm(enable ? `¿Habilitar a ${userName}?` : `¿Deshabilitar a ${userName}?`)) return;

    setLoading(true);
    try {
      await embyService.toggleUser(userId, serverId, enable);
      toast.success(enable ? 'Usuario habilitado' : 'Usuario deshabilitado');
      onRefresh();
    } catch {
      toast.error('Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (data) => {
    try {
      await embyService.createUser(data);
      onRefresh();
    } catch (err) {
      throw new Error(err.message || 'Error');
    }
  };

  const handleEditUser = async (data) => {
    try {
      await embyService.editUser({
        userId: userToEdit.id,
        serverId: userToEdit.serverId,
        ...data
      });
      onRefresh();
    } catch (err) {
      throw new Error(err.message || 'Error');
    }
  };

  const handleDeleteUser = async (userId, serverId, userName) => {
    if (!confirm(`¿ELIMINAR a ${userName}?`)) return;
    setLoading(true);
    try {
      await embyService.deleteUser(userId, serverId);
      toast.success('Usuario eliminado');
      onRefresh();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async (userId, serverId, userName) => {
    if (!confirm(`¿Extender 1 Mes a ${userName}?`)) return;
    setLoading(true);
    try {
      await embyService.extendSubscription(userId, serverId, 1);
      toast.success('Suscripción extendida 1 mes');
      onRefresh();
    } catch {
      toast.error('Error al extender');
    } finally {
      setLoading(false);
    }
  };

  const handleStopPlayback = async (sessionId, serverId, deviceName) => {
    if (!confirm(`¿Detener reproducción en ${deviceName}?`)) return;
    try {
      await embyService.stopPlayback(sessionId, serverId);
      toast.success(`Reproducción detenida en ${deviceName}`);
      onRefresh();
    } catch {
      toast.error('Error al detener');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card/30 p-4 rounded-xl border border-white/5">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario..."
            className="pl-9 bg-black/50 border-white/10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading} className="shrink-0">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button variant="cyber" onClick={() => setShowCreateModal(true)} disabled={loading} className="w-full md:w-auto text-white">
            <Plus className="h-4 w-4 mr-2" /> CREAR USUARIO
          </Button>
        </div>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-card/50 h-9 font-medium"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Estados</SelectItem>
            <SelectItem value="online">En Línea</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="disabled">Deshabilitados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
          <SelectTrigger className="bg-card/50 h-9 font-medium"><SelectValue placeholder="Suscripción" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las Subs</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="expiring">Por Vencer</SelectItem>
            <SelectItem value="expired">Vencidas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={creatorFilter} onValueChange={setCreatorFilter}>
          <SelectTrigger className="bg-card/50 h-9 font-medium"><SelectValue placeholder="Creado Por" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier Creador</SelectItem>
            {creators.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={screenFilter} onValueChange={setScreenFilter}>
          <SelectTrigger className="bg-card/50 h-9 font-medium"><SelectValue placeholder="Pantallas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier Limite</SelectItem>
            <SelectItem value="1">1 Pantalla</SelectItem>
            <SelectItem value="3">3 Pantallas</SelectItem>
            <SelectItem value="5">5+ Pantallas</SelectItem>
            <SelectItem value="unlimited">Ilimitadas</SelectItem>
          </SelectContent>
        </Select>
        {servers.length > 1 && (
          <Select value={serverFilter} onValueChange={setServerFilter}>
            <SelectTrigger className="bg-card/50 h-9 font-medium"><SelectValue placeholder="Servidor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Servidores</SelectItem>
              {servers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-white/5 border-b border-primary/20">
            <TableRow className="border-white/5 hover:bg-white/5">
              <TableHead className="text-primary font-bold tracking-wider w-[200px]">USUARIO</TableHead>
              <TableHead className="text-white/70">ESTADO</TableHead>
              <TableHead className="text-white/70">PANTALLAS</TableHead>
              <TableHead className="text-white/70">CREADO POR</TableHead>
              <TableHead className="text-white/70">SUSCRIPCIÓN</TableHead>
              <TableHead className="text-white/70 w-[200px]">DISPOSITIVOS ACTUALES</TableHead>
              <TableHead className="text-right text-primary font-bold">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const subKey = getSubKey(user.id, user.serverId);
              const sub = subscriptions[subKey];
              const maxScreens = user.policy?.SimultaneousStreamLimit || user.simultaneousStreamLimit || '∞';

              return (
                <TableRow key={subKey} className="border-white/5 hover:bg-primary/5 transition-colors group">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={cn("font-medium text-base text-white", user.isDisabled && "text-muted-foreground line-through decoration-destructive")}>
                        {user.name}
                      </span>
                      {user.isAdministrator && <span className="text-[10px] text-warning uppercase tracking-widest font-bold">ADMIN</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.isDisabled ? (
                      <Badge variant="destructive" className="font-mono">DESHABILITADO</Badge>
                    ) : user.isOnline ? (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/50 hover:bg-green-500/30 animate-pulse-fast font-mono">ONLINE</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs font-mono">OFFLINE</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{maxScreens}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/5">
                      {user.creator || 'Sistema'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.isAdministrator ? (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground">Vence:</span>
                        <span className={cn(
                          "text-sm font-mono font-medium",
                          new Date(sub?.expirationDate) < new Date() ? "text-destructive" : "text-green-500"
                        )}>
                          {formatDate(sub?.expirationDate)}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {user.activeSessions && user.activeSessions.length > 0 ? (
                        user.activeSessions.map(s => (
                          <div key={s.id} className="flex items-center justify-between text-xs bg-black/50 p-1.5 rounded border border-white/10 group/session hover:border-primary/50 transition-colors">
                            <div className="truncate max-w-[120px]" title={s.deviceName}>
                              <span className="text-white block">{s.deviceName}</span>
                              <span className="text-muted-foreground text-[10px]">{s.client}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover/session:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-5 w-5"
                                onClick={() => handleStopPlayback(s.id, user.serverId, s.deviceName)}
                                title="Detener Reproducción"
                              >
                                <Square className="h-3 w-3 fill-current" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sin actividad</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!user.isAdministrator && (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-info hover:bg-info/10 border border-transparent hover:border-info/20" onClick={() => { setUserToEdit(user); setShowEditModal(true); }} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className={cn("h-8 w-8 border border-transparent", user.isDisabled ? "hover:text-green-500 hover:bg-green-500/10 hover:border-green-500/20" : "hover:text-orange-500 hover:bg-orange-500/10 hover:border-orange-500/20")} onClick={() => handleToggleUser(user.id, user.serverId, user.name, user.isDisabled)} title={user.isDisabled ? "Habilitar" : "Deshabilitar"}>
                            {user.isDisabled ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20" onClick={() => handleDeleteUser(user.id, user.serverId, user.name)} title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground flex-col gap-2">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
                    <span>No se encontraron usuarios</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <UserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
        servers={servers}
        mode="create"
        currentUser={currentUser}
      />

      <UserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditUser}
        servers={servers}
        mode="edit"
        user={userToEdit}
        currentUser={currentUser}
      />
    </div>
  );
}
