import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Clock, AlertCircle, Users, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Skeleton } from '@/components/ui/skeleton';

interface CalendarAction {
  id: string;
  title: string;
  notes: string;
  status: 'hecho' | 'por_hacer' | 'en_proceso' | 'en_revision' | 'reunion_cliente' | 'pending';
  businessUnit?: 'lemonsuite' | 'casetracking' | 'lemonflow' | 'all';
  week?: string;
}

const statusConfig: Record<CalendarAction['status'], { label: string; color: string; icon: React.ReactNode }> = {
  hecho: { label: 'Hecho', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 className="h-3 w-3" /> },
  por_hacer: { label: 'Por Hacer', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle className="h-3 w-3" /> },
  en_proceso: { label: 'En Proceso', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Clock className="h-3 w-3" /> },
  en_revision: { label: 'En Revisión', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <FileText className="h-3 w-3" /> },
  reunion_cliente: { label: 'Reunión Cliente', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Users className="h-3 w-3" /> },
  pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: <Clock className="h-3 w-3" /> },
};

const businessUnitLabels: Record<string, string> = {
  lemonsuite: 'SUITE',
  casetracking: 'CT',
  lemonflow: 'FLOW',
  all: 'ALL',
};

interface ActionCalendarProps {
  businessUnit?: string;
}

export function ActionCalendar({ businessUnit }: ActionCalendarProps) {
  const { data: calendarData, isLoading } = trpc.sheets.calendar.useQuery(
    { businessUnit },
    { refetchInterval: 60000 } // Refresh every minute
  );

  const actions = calendarData?.data || [];

  // Group actions by status for summary
  const statusCounts = actions.reduce((acc, action) => {
    acc[action.status] = (acc[action.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Separate actions by status for display
  const pendingActions = actions.filter(a => a.status === 'por_hacer' || a.status === 'pending');
  const inProgressActions = actions.filter(a => a.status === 'en_proceso' || a.status === 'en_revision' || a.status === 'reunion_cliente');
  const completedActions = actions.filter(a => a.status === 'hecho');

  if (isLoading) {
    return (
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Calendar className="h-4 w-4 text-orange-500" />
            CRONOGRAMA DE ENTREGABLES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Calendar className="h-4 w-4 text-orange-500" />
            CRONOGRAMA DE ENTREGABLES
          </CardTitle>
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {completedActions.length} Hechos
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {inProgressActions.length} En Proceso
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              {pendingActions.length} Pendientes
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Pending / To Do */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Por Hacer ({pendingActions.length})
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {pendingActions.map((action) => (
                <ActionItem key={action.id} action={action} />
              ))}
              {pendingActions.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No hay tareas pendientes</p>
              )}
            </div>
          </div>

          {/* In Progress */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-blue-600 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              En Proceso ({inProgressActions.length})
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {inProgressActions.map((action) => (
                <ActionItem key={action.id} action={action} />
              ))}
              {inProgressActions.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No hay tareas en proceso</p>
              )}
            </div>
          </div>

          {/* Completed */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Completados ({completedActions.length})
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {completedActions.slice(0, 8).map((action) => (
                <ActionItem key={action.id} action={action} />
              ))}
              {completedActions.length > 8 && (
                <p className="text-xs text-muted-foreground">
                  +{completedActions.length - 8} más completados
                </p>
              )}
              {completedActions.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No hay tareas completadas</p>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t flex flex-wrap gap-2 text-xs">
          {Object.entries(statusConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${config.color}`}>
                {config.icon}
                {config.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActionItem({ action }: { action: CalendarAction }) {
  const config = statusConfig[action.status];
  
  return (
    <div className="p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" title={action.title}>
            {action.title}
          </p>
          {action.notes && (
            <p className="text-xs text-muted-foreground truncate mt-0.5" title={action.notes}>
              {action.notes}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge 
            variant="outline" 
            className={`text-[10px] px-1.5 py-0 h-5 ${config.color}`}
          >
            {config.icon}
            <span className="ml-1">{config.label}</span>
          </Badge>
          {action.businessUnit && action.businessUnit !== 'all' && (
            <span className="text-[10px] text-muted-foreground">
              {businessUnitLabels[action.businessUnit]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
