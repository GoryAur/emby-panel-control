'use client';

import { useState, useEffect } from 'react';
import { Server, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { serverService } from '@/services/servers';

export default function ServerManagement() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingServer, setEditingServer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    apiKey: '',
    enabled: true,
  });

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const data = await serverService.getServers();
      setServers(data.servers || []);
    } catch (error) {
      toast.error(error.message || 'Error loading servers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingServer) {
        await serverService.updateServer({ serverId: editingServer.id, ...formData });
      } else {
        await serverService.addServer(formData);
      }

      toast.success(editingServer ? 'Servidor Actualizado' : 'Servidor Añadido');
      setShowDialog(false);
      setEditingServer(null);
      setFormData({ name: '', url: '', apiKey: '', enabled: true });
      loadServers();
    } catch (error) {
      toast.error(error.message || 'Error saving server');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (server) => {
    setEditingServer(server);
    setFormData({
      name: server.name,
      url: server.url,
      apiKey: '',
      enabled: server.enabled,
    });
    setShowDialog(true);
  };

  const openCreate = () => {
    setEditingServer(null);
    setFormData({ name: '', url: '', apiKey: '', enabled: true });
    setShowDialog(true);
  };

  const handleDelete = async (serverId, serverName) => {
    if (!confirm(`¿Eliminar servidor "${serverName}"?`)) return;

    setLoading(true);
    try {
      await serverService.deleteServer(serverId);
      toast.success('Servidor eliminado');
      loadServers();
    } catch (error) {
      toast.error(error.message || 'Error deleting');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (serverId, currentStatus) => {
    try {
      await serverService.toggleServer(serverId, !currentStatus);
      toast.success(`Servidor ${!currentStatus ? 'Habilitado' : 'Deshabilitado'}`);
      loadServers();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card/50 p-6 rounded-xl border border-border/50">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Red de Servidores</h2>
          <p className="text-muted-foreground">Administra tus instancias de Emby</p>
        </div>
        <Button variant="cyber" onClick={openCreate} disabled={loading}>
          <Plus className="mr-2 h-4 w-4" /> AÑADIR SERVIDOR
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server) => (
          <Card key={server.id} className={cn(
            "border-l-4 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10",
            server.enabled ? "border-l-primary" : "border-l-muted opacity-70"
          )}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  {server.name}
                </CardTitle>
                <Switch
                  checked={server.enabled}
                  onCheckedChange={() => handleToggle(server.id, server.enabled)}
                />
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-muted-foreground">URL</span>
                <span className="font-mono text-white/80 truncate max-w-[150px]">{server.url}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-muted-foreground">API Key</span>
                <span className="font-mono text-white/50">••••••••</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Creado</span>
                <span className="text-white/80">{new Date(server.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-0">
              <Button variant="ghost" size="sm" onClick={() => openEdit(server)}>
                <Edit className="h-4 w-4 mr-2" /> Editar
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(server.id, server.name)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
        {servers.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-white/10 rounded-xl">
            No hay servidores configurados. Añade uno para comenzar.
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingServer ? 'Editar Servidor' : 'Añadir Nuevo Servidor'}</DialogTitle>
            <DialogDescription>
              Configura la conexión a tu instancia de Emby.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Servidor</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Servidor Principal" required />
            </div>
            <div className="space-y-2">
              <Label>URL del Servidor</Label>
              <Input type="url" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="http://ip:8096" required />
            </div>
            <div className="space-y-2">
              <Label>Clave API</Label>
              <Input type="password" value={formData.apiKey} onChange={e => setFormData({ ...formData, apiKey: e.target.value })} placeholder={editingServer ? "Sin cambios" : "Requerido"} required={!editingServer} />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch id="enabled" checked={formData.enabled} onCheckedChange={c => setFormData({ ...formData, enabled: c })} />
              <Label htmlFor="enabled">Habilitado</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowDialog(false)}>Cancelar</Button>
              <Button type="submit" variant="cyber" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Servidor'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
