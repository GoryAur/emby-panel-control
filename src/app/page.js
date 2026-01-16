'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Wifi, UserX, Clock, RefreshCw, LogOut, User,
  Server, Users2, Settings, Play, TrendingUp, Activity, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

import { authService } from '@/services/auth';
import { embyService } from '@/services/emby';
import { serverService } from '@/services/servers';

import UserTable from '@/components/UserTable';
import AutoDisable from '@/components/AutoDisable';
import ServerManagement from '@/components/ServerManagement';
import ResellersManagement from '@/components/ResellersManagement';

export default function Home() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [currentUser, setCurrentUser] = useState(null);

  const fetchData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const [usersData, subsData, serversData] = await Promise.all([
        embyService.getUsers(),
        embyService.getSubscriptions(),
        serverService.getServers(),
      ]);

      setUsers(usersData);
      setSubscriptions(subsData);
      setServers(serversData.servers);
    } catch (err) {
      if (!silent) setError('Connection failure');
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCurrentUser();

    const intervalId = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const data = await authService.getCurrentUser();
      if (data && data.user) {
        setCurrentUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error(err);
      // Optional: don't redirect on error if you want to allow anonymous viewing?
      // But typically we enforce auth
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  const getExpiredCount = () => {
    const now = new Date();
    return users.filter(u => {
      if (u.isDisabled || u.isAdministrator) return false;
      const subKey = `${u.serverId}__${u.id}`;
      const sub = subscriptions[subKey];
      if (!sub?.expirationDate) return false;
      return new Date(sub.expirationDate) < now;
    }).length;
  };

  const stats = {
    total: users.length,
    online: users.filter(u => u.isOnline).length,
    disabled: users.filter(u => u.isDisabled).length,
    expired: getExpiredCount(),
  };

  if (!currentUser) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;

  return (
    <div className="min-h-screen bg-black text-foreground relative overflow-x-hidden font-sans selection:bg-primary/30">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,227,72,0.3)]">
                <Play className="h-5 w-5 text-primary fill-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tighter text-white leading-none">PANEL<span className="text-primary">EMBY</span></h1>
                <p className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">Sistema v2.0</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => fetchData()} disabled={loading} className="hidden sm:flex text-muted-foreground hover:text-white">
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                ACTUALIZAR
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-colors">
                    <User className="h-4 w-4 text-primary" />
                    <span className="hidden sm:inline font-mono text-xs">{users.length > 0 ? currentUser.name : '...'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-white/10 bg-black/90 backdrop-blur-xl">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className="text-xs font-mono text-muted-foreground uppercase">
                    {currentUser.role === 'admin' ? 'Administrador' : 'Revendedor'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-primary bg-card/40 hover:bg-card/60 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Total Usuarios</p>
                  <h3 className="text-3xl font-bold mt-1 text-white">{loading ? <Skeleton className="h-8 w-16 bg-white/10" /> : stats.total}</h3>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-card/40 hover:bg-card/60 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">En Línea</p>
                  <h3 className="text-3xl font-bold mt-1 text-green-500">{loading ? <Skeleton className="h-8 w-16 bg-white/10" /> : stats.online}</h3>
                </div>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Wifi className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 bg-card/40 hover:bg-card/60 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Vencidos</p>
                  <h3 className="text-3xl font-bold mt-1 text-orange-500">{loading ? <Skeleton className="h-8 w-16 bg-white/10" /> : stats.expired}</h3>
                </div>
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive bg-card/40 hover:bg-card/60 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Desactivados</p>
                  <h3 className="text-3xl font-bold mt-1 text-destructive">{loading ? <Skeleton className="h-8 w-16 bg-white/10" /> : stats.disabled}</h3>
                </div>
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <UserX className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="bg-white/5 border border-white/10 p-1 h-auto gap-1">
              <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-black h-10 px-6 gap-2 font-mono uppercase tracking-wide">
                <Users className="h-4 w-4" /> Usuarios
              </TabsTrigger>
              {currentUser.role === 'admin' && (
                <>
                  <TabsTrigger value="servers" className="data-[state=active]:bg-primary data-[state=active]:text-black h-10 px-6 gap-2 font-mono uppercase tracking-wide">
                    <Server className="h-4 w-4" /> Servidores
                  </TabsTrigger>
                  <TabsTrigger value="resellers" className="data-[state=active]:bg-primary data-[state=active]:text-black h-10 px-6 gap-2 font-mono uppercase tracking-wide">
                    <Users2 className="h-4 w-4" /> Revendedores
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-black h-10 px-6 gap-2 font-mono uppercase tracking-wide">
                    <Settings className="h-4 w-4" /> Sistema
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <TabsContent value="users" className="focus-visible:outline-none">
            <UserTable users={users} subscriptions={subscriptions} servers={servers} onRefresh={fetchData} />
          </TabsContent>

          {currentUser.role === 'admin' && (
            <>
              <TabsContent value="servers" className="focus-visible:outline-none">
                <ServerManagement />
              </TabsContent>

              <TabsContent value="resellers" className="focus-visible:outline-none">
                <ResellersManagement />
              </TabsContent>

              <TabsContent value="settings" className="focus-visible:outline-none">
                <div className="grid gap-6 md:grid-cols-2">
                  <AutoDisable onRefresh={fetchData} />
                  {/* Add more system settings here */}
                  <Card className="border-l-4 border-l-info">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-info" />
                        <CardTitle>Información del Sistema</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-muted-foreground">Versión</span>
                        <Badge variant="outline">2.0.0 CyberGreen</Badge>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-muted-foreground">Estado</span>
                        <Badge variant="default" className="bg-green-500/20 text-green-500">Operativo</Badge>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-muted-foreground">Entorno</span>
                        <span className="font-mono text-sm">Producción</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}
