'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { User, Lock, ArrowRight, AlertCircle, Loader2, Disc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      await authService.getCurrentUser();
      router.push('/');
    } catch (err) {
      // Not authenticated
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(formData.username, formData.password);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Acceso Denegado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black selection:bg-primary/30 selection:text-primary">
      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" />

      {/* Primary Glitch Blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse delay-1000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <Card className="backdrop-blur-xl bg-black/40 border-primary/20 shadow-[0_0_50px_-12px_rgba(0,227,72,0.25)]">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-2 border border-primary/20 shadow-[0_0_20px_rgba(0,227,72,0.2)]">
              <Disc className="w-10 h-10 text-primary animate-spin-slow" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-bold tracking-tighter text-white">
                PANEL<span className="text-primary">EMBY</span>
              </CardTitle>
              <CardDescription className="text-gray-400 font-mono text-xs uppercase tracking-[0.2em]">
                Punto de Acceso
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-3 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">{error}</span>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs uppercase tracking-wider text-gray-500">Usuario</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="pl-10 bg-black/50 border-white/10 focus:border-primary/50 font-mono tracking-wide"
                    placeholder="INGRESE ID..."
                    required
                    autoFocus
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" classname="text-xs uppercase tracking-wider text-gray-500">Contraseña</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 bg-black/50 border-white/10 focus:border-primary/50 font-mono tracking-wide"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="cyber"
                className="w-full h-12 text-sm mt-4 group relative overflow-hidden"
                disabled={loading}
              >
                <div className="absolute inset-0 bg-primary/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    AUTENTICANDO...
                  </>
                ) : (
                  <>
                    <span>INICIAR SESIÓN</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-white/5 py-4">
            <p className="text-xs text-gray-600 font-mono">CONEXIÓN SEGURA v4.0</p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
