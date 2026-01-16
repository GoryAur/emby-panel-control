'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Play, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { embyService } from '@/services/emby';

export default function AutoDisable({ onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePreview = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await embyService.checkExpired(true);
      setResult(data);
    } catch {
      toast.error('Error al verificar');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!confirm(`¿Estás seguro de que deseas desactivar TODOS los usuarios vencidos?`)) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await embyService.checkExpired(false);
      toast.success('Auto-desactivación ejecutada');
      setResult(data);
      if (onRefresh) onRefresh();
    } catch {
      toast.error('Error al ejecutar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-warning">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          Auto-Desactivar Usuarios Vencidos
        </CardTitle>
        <CardDescription>
          Desactiva automáticamente a los usuarios cuya suscripción ha expirado. Los administradores nunca se ven afectados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button variant="secondary" onClick={handlePreview} disabled={loading}>
            <Play className="h-4 w-4 mr-2" /> Vista Previa
          </Button>
          <Button variant="destructive" onClick={handleExecute} disabled={loading}>
            <AlertCircle className="h-4 w-4 mr-2" /> Ejecutar
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${result.dryRun ? 'bg-secondary border-secondary' : 'bg-green-900/20 border-green-500/20'}`}>
            <h3 className="font-bold mb-2 flex items-center gap-2 text-white">
              {result.dryRun ? <Play className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {result.message}
            </h3>
            {result.users.length > 0 ? (
              <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                {result.users.map(user => (
                  <li key={user.id}>
                    <span className="text-white font-medium">{user.name}</span> - Vencido hace {user.daysExpired} días
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No se encontraron usuarios vencidos.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
