'use client';

import { Search, Plus, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectOption } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function UserFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  subscriptionFilter,
  onSubscriptionChange,
  serverFilter,
  onServerChange,
  servers,
  onClearFilters,
  onCreateUser,
  loading,
  totalUsers,
  filteredCount,
}) {
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || subscriptionFilter !== 'all' || serverFilter !== 'all';

  const activeFilterCount = [
    searchTerm,
    statusFilter !== 'all',
    subscriptionFilter !== 'all',
    serverFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search and Create Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar usuario..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          onClick={onCreateUser}
          disabled={loading || servers.length === 0}
          className="gap-2 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>Crear Usuario</span>
        </Button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="text-sm font-medium">Filtros</span>
        </div>

        {servers.length > 1 && (
          <Select
            value={serverFilter}
            onChange={(e) => onServerChange(e.target.value)}
            className="w-auto min-w-[140px]"
          >
            <SelectOption value="all">Todos los servidores</SelectOption>
            {servers.map(server => (
              <SelectOption key={server.id} value={server.id}>{server.name}</SelectOption>
            ))}
          </Select>
        )}

        <Select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-auto min-w-[130px]"
        >
          <SelectOption value="all">Todos</SelectOption>
          <SelectOption value="online">En linea</SelectOption>
          <SelectOption value="offline">Desconectados</SelectOption>
          <SelectOption value="disabled">Deshabilitados</SelectOption>
        </Select>

        <Select
          value={subscriptionFilter}
          onChange={(e) => onSubscriptionChange(e.target.value)}
          className="w-auto min-w-[150px]"
        >
          <SelectOption value="all">Todas</SelectOption>
          <SelectOption value="active">Activas</SelectOption>
          <SelectOption value="expiring">Por vencer</SelectOption>
          <SelectOption value="expired">Vencidas</SelectOption>
          <SelectOption value="none">Sin suscripcion</SelectOption>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {hasActiveFilters ? (
            <>
              <span className="font-semibold text-foreground">{filteredCount}</span>
              {' '}de{' '}
              <span className="font-semibold text-foreground">{totalUsers}</span>
              {' '}usuarios
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground">{totalUsers}</span>
              {' '}usuarios
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default UserFilters;
