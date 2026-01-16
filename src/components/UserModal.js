'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  X, Plus, Pencil, AlertCircle, Check, Loader2, Info, Monitor, Cloud, Calendar,
  Eye, EyeOff, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Quick date selection buttons
function QuickDateButtons({ onSelect, currentDate }) {
  const options = [
    { label: '1 Mes', days: 30 },
    { label: '3 Meses', days: 90 },
    { label: '6 Meses', days: 180 },
    { label: '1 Año', days: 365 },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ label, days }) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        const dateStr = date.toISOString().split('T')[0];
        const isSelected = currentDate === dateStr;

        return (
          <Button
            key={days}
            type="button"
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(dateStr)}
            className="h-7 text-xs"
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

export default function UserModal({
  isOpen,
  onClose,
  onSubmit,
  servers,
  mode = 'create',
  user = null,
  currentUser = null,
}) {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    embyConnectEmail: '',
    serverId: '',
    expirationDate: '',
    isAdmin: false,
    userType: '1 Pantalla',
    libraryAccess: 'all',
    selectedLibraries: [],
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [libraries, setLibraries] = useState([]);
  const [loadingLibraries, setLoadingLibraries] = useState(false);

  // Default expiration logic
  const defaultExpirationDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }, []);

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setFormData({
          name: user.Name || user.name || '',
          password: '', // Don't show password
          embyConnectEmail: user.embyConnectEmail || '',
          serverId: user.serverId || '',
          expirationDate: '', // Expiration handled separately in table usually, but can be here if needed
          isAdmin: false,
          userType: '', // Could be fetched but usually separate
          libraryAccess: 'all',
          selectedLibraries: [],
        });
      } else {
        // Create
        setFormData({
          name: '',
          password: '',
          embyConnectEmail: '',
          serverId: servers[0]?.id || '',
          expirationDate: defaultExpirationDate,
          isAdmin: false,
          userType: '1 Pantalla',
          libraryAccess: 'all',
          selectedLibraries: [],
        });
        if (servers[0]?.id) loadLibraries(servers[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, user]);

  // Load libraries on server change
  useEffect(() => {
    if (formData.serverId && mode === 'create') {
      loadLibraries(formData.serverId);
    }
  }, [formData.serverId, mode]);

  const loadLibraries = async (serverId) => {
    setLoadingLibraries(true);
    try {
      const res = await fetch('/api/emby/libraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId })
      });
      const data = await res.json();
      setLibraries(res.ok ? data.libraries || [] : []);
    } catch (e) {
      console.error(e);
      setLibraries([]);
    } finally {
      setLoadingLibraries(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = { ...formData };
      if (mode === 'create') {
        submitData.enabledLibraries = formData.libraryAccess === 'all' ? 'all' : formData.selectedLibraries;
      }

      await onSubmit(submitData);
      onClose();
      toast.success(mode === 'create' ? 'Usuario creado' : 'Usuario actualizado');
    } catch (err) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const toggleLibrary = (id) => {
    setFormData(prev => ({
      ...prev,
      selectedLibraries: prev.selectedLibraries.includes(id)
        ? prev.selectedLibraries.filter(l => l !== id)
        : [...prev.selectedLibraries, id]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg border-primary/20 bg-black/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            {mode === 'create' ? <Plus className="h-5 w-5 text-primary" /> : <Pencil className="h-5 w-5 text-info" />}
            {mode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Ingresa los datos para registrar un nuevo usuario en Emby.' : `Modificando acceso para: ${user?.name}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">

          {/* Name */}
          <div className="space-y-2">
            <Label>Nombre de Usuario</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              disabled={mode === 'edit'}
              placeholder="Ej. JuanPerez"
              className="font-mono"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label>{mode === 'create' ? 'Contraseña' : 'Nueva Contraseña (Opcional)'}</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder={mode === 'create' ? '••••••••' : 'Dejar vacío para mantener actual'}
                className="pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Emby Connect */}
          <div className="space-y-2">
            <Label>Emby Connect Email (Opcional)</Label>
            <Input
              type="email"
              value={formData.embyConnectEmail}
              onChange={e => setFormData({ ...formData, embyConnectEmail: e.target.value })}
              placeholder="usuario@email.com"
              className="font-mono"
            />
          </div>

          {/* Server Select */}
          <div className="space-y-2">
            <Label>Servidor</Label>
            <Select
              value={formData.serverId}
              onValueChange={val => setFormData({ ...formData, serverId: val })}
              disabled={mode === 'edit'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un servidor" />
              </SelectTrigger>
              <SelectContent>
                {servers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create Only Fields */}
          {mode === 'create' && (
            <>
              <div className="space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <div className="space-y-2">
                  <Input
                    type="date"
                    value={formData.expirationDate}
                    onChange={e => setFormData({ ...formData, expirationDate: e.target.value })}
                    required
                  />
                  <QuickDateButtons
                    currentDate={formData.expirationDate}
                    onSelect={d => setFormData({ ...formData, expirationDate: d })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Usuario / Pantallas</Label>
                <Select
                  value={formData.userType}
                  onValueChange={val => setFormData({ ...formData, userType: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 Pantalla">1 Pantalla</SelectItem>
                    <SelectItem value="3 Pantallas">3 Pantallas</SelectItem>
                    <SelectItem value="5 Pantallas">5 Pantallas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Check */}
              {currentUser?.role === 'admin' && (
                <div className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id="isAdmin"
                    checked={formData.isAdmin}
                    onCheckedChange={c => setFormData({ ...formData, isAdmin: c })}
                  />
                  <Label htmlFor="isAdmin" className="cursor-pointer text-warning font-semibold">
                    Acceso de Administrador
                  </Label>
                </div>
              )}
            </>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="cyber" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
