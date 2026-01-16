'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

import { authService } from '@/services/auth';

export default function ResellersManagement() {
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingReseller, setEditingReseller] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    loadResellers();
  }, []);

  const loadResellers = async () => {
    setLoading(true);
    try {
      const data = await authService.getResellers();
      setResellers(data.users || []);
    } catch (error) {
      toast.error(error.message || 'Error cargando revendedores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingReseller) {
        await authService.updateReseller({ userId: editingReseller.id, ...formData });
      } else {
        await authService.createReseller(formData);
      }

      toast.success(editingReseller ? 'Revendedor Actualizado' : 'Revendedor Creado');
      setShowDialog(false);
      setEditingReseller(null);
      setFormData({ name: '', username: '', password: '' });
      loadResellers();
    } catch (error) {
      toast.error(error.message || 'Error guardando revendedor');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reseller) => {
    setEditingReseller(r);
    setFormData({ username: r.username, password: '', name: r.name });
    setShowDialog(true);
  };

  const openCreate = () => {
    setEditingReseller(null);
    setFormData({ username: '', password: '', name: '' });
    setShowDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card/50 p-6 rounded-xl border border-white/5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Revendedores</h2>
          <p className="text-sm text-muted-foreground">Gestionar acceso de revendedores al panel</p>
        </div>
        <Button variant="cyber" onClick={openCreate} disabled={loading}>
          <Plus className="mr-2 h-4 w-4" /> NUEVO REVENDEDOR
        </Button>
      </div>

      <Card className="border-0 shadow-none bg-transparent">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-white/5">
              <TableHead className="text-white/70">NOMBRE</TableHead>
              <TableHead className="text-white/70">USUARIO</TableHead>
              <TableHead className="text-white/70">CREADO</TableHead>
              <TableHead className="text-right text-primary">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resellers.map(r => (
              <TableRow key={r.id} className="border-white/5 hover:bg-primary/5 transition-colors group">
                <TableCell className="font-medium text-white">{r.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs font-mono">@{r.username}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(r.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-info" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(r)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {resellers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  NO SE ENCONTRARON REVENDEDORES
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReseller ? 'Editar Revendedor' : 'Nuevo Revendedor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Juan Perez" />
            </div>
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required disabled={!!editingReseller} placeholder="juanperez" />
            </div>
            <div className="space-y-2">
              <Label>{editingReseller ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</Label>
              <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingReseller} placeholder={editingReseller ? "Dejar vacío para mantener" : "Contraseña segura"} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowDialog(false)}>Cancelar</Button>
              <Button type="submit" variant="cyber" disabled={loading}>Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
