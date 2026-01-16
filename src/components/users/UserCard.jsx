'use client';

import { useState } from 'react';
import {
  Calendar, Pencil, UserX, UserCheck, Trash2, Square, Cloud, Monitor, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Status Badge Component
export function StatusBadge({ user }) {
  if (user.isDisabled) {
    return (
      <Badge variant="destructive" className="gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        Deshabilitado
      </Badge>
    );
  }
  if (user.isOnline) {
    return (
      <Badge variant="success" className="gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        En linea
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      Desconectado
    </Badge>
  );
}

// Subscription Badge Component
export function SubscriptionBadge({ subscription }) {
  if (!subscription?.expirationDate) {
    return (
      <Badge variant="warning" className="gap-1">
        <Calendar className="w-3 h-3" />
        Sin suscripcion
      </Badge>
    );
  }

  const now = new Date();
  const expDate = new Date(subscription.expirationDate);
  const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <Calendar className="w-3 h-3" />
        Vencida ({Math.abs(daysLeft)}d)
      </Badge>
    );
  } else if (daysLeft <= 7) {
    return (
      <Badge variant="warning" className="gap-1">
        <Calendar className="w-3 h-3" />
        Vence en {daysLeft}d
      </Badge>
    );
  } else {
    return (
      <Badge variant="success" className="gap-1">
        <Calendar className="w-3 h-3" />
        {daysLeft} dias
      </Badge>
    );
  }
}

// Screens Badge Component
export function ScreensBadge({ limit }) {
  const text = !limit || limit === 0
    ? 'Sin limite'
    : limit === 1
      ? '1 Pantalla'
      : `${limit} Pantallas`;

  return (
    <Badge variant="info" className="gap-1">
      <Monitor className="w-3 h-3" />
      {text}
    </Badge>
  );
}

// User Card Component
export function UserCard({
  user,
  subscription,
  serverName,
  showServer,
  creatorName,
  isAdmin,
  onExtend,
  onEdit,
  onToggle,
  onDelete,
  onStopPlayback,
  onEditExpiration,
  loading,
}) {
  const [editingExpiration, setEditingExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const handleStartEditExpiration = () => {
    if (subscription?.expirationDate) {
      const date = new Date(subscription.expirationDate);
      setExpirationDate(date.toISOString().split('T')[0]);
    } else {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      setExpirationDate(futureDate.toISOString().split('T')[0]);
    }
    setEditingExpiration(true);
  };

  const handleSaveExpiration = () => {
    onEditExpiration(user.id, user.serverId, expirationDate);
    setEditingExpiration(false);
  };

  return (
    <Card className={cn(
      'overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/30',
      user.isDisabled && 'opacity-60'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{user.name}</h3>
              {user.hasEmbyConnect && (
                <Cloud
                  className="h-4 w-4 text-info flex-shrink-0"
                  title={`Emby Connect: ${user.embyConnectEmail || ''}`}
                />
              )}
              {user.isAdministrator && (
                <Badge variant="info" className="text-xs">Admin</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <StatusBadge user={user} />
              <SubscriptionBadge subscription={subscription} />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {showServer && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Servidor</span>
            <Badge variant="outline">{serverName}</Badge>
          </div>
        )}

        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Pantallas</span>
          <ScreensBadge limit={user.simultaneousStreamLimit} />
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Vencimiento</span>
          {editingExpiration ? (
            <div className="flex gap-1.5">
              <Input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-32 h-8 text-xs"
              />
              <Button size="sm" variant="success" className="h-8 px-2" onClick={handleSaveExpiration} disabled={loading}>
                OK
              </Button>
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingExpiration(false)}>
                X
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{formatDate(subscription?.expirationDate)}</span>
              {!user.isAdministrator && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={handleStartEditExpiration}
                >
                  <Calendar className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Creado por</span>
            <span className="text-foreground">{creatorName}</span>
          </div>
        )}

        {/* Active Sessions */}
        {user.activeSessions?.length > 0 && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Sesiones Activas</p>
            <div className="space-y-1.5">
              {user.activeSessions.map(session => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{session.deviceName}</p>
                    <p className="text-xs text-muted-foreground">{session.client}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="warning"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => onStopPlayback(session.id, user.serverId, user.name, session.deviceName)}
                    disabled={loading}
                    title="Detener reproduccion"
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!user.isAdministrator && (
        <div className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              onClick={() => onExtend(user.id, user.serverId, user.name, 1)}
              disabled={loading}
              className="gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              1 mes
            </Button>
            <Button
              size="sm"
              variant="info"
              onClick={() => onEdit(user)}
              disabled={loading}
              className="gap-1"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
            <Button
              size="sm"
              variant={user.isDisabled ? 'success' : 'warning'}
              onClick={() => onToggle(user.id, user.serverId, user.name, user.isDisabled)}
              disabled={loading}
              className="gap-1"
            >
              {user.isDisabled ? (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  Habilitar
                </>
              ) : (
                <>
                  <UserX className="h-3.5 w-3.5" />
                  Deshabilitar
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(user.id, user.serverId, user.name)}
              disabled={loading}
              className="gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default UserCard;
