import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Lightbulb, 
  CheckCircle, 
  XCircle, 
  Clock,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Activity {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  metadata: any;
  created_at: string;
  profile_name?: string;
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    
    // Realtime subscription
    const channel = supabase
      .channel('activities-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities'
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      console.log('Buscando atividades...');
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('Atividades encontradas:', activitiesData);
      if (activitiesError) {
        console.error('Erro ao buscar atividades:', activitiesError);
        throw activitiesError;
      }

      if (!activitiesData || activitiesData.length === 0) {
        console.log('Nenhuma atividade encontrada');
        setActivities([]);
        setLoading(false);
        return;
      }

      // Buscar perfis separadamente
      const userIds = activitiesData?.map(a => a.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      console.log('Perfis das atividades:', profilesData);
      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        throw profilesError;
      }

      // Combinar dados
      const combined = activitiesData?.map(activity => {
        const profile = profilesData?.find(p => p.user_id === activity.user_id);
        return {
          ...activity,
          profile_name: profile?.name || 'Usuário',
        };
      });

      console.log('Atividades combinadas:', combined);
      setActivities(combined || []);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'idea_created':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'idea_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'idea_rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const name = activity.profile_name || 'Usuário';
    const title = activity.metadata?.title || 'uma ideia';

    switch (activity.action_type) {
      case 'idea_created':
        return `${name} criou a ideia "${title}"`;
      case 'idea_approved':
        return `${name} teve a ideia "${title}" aprovada 🎉`;
      case 'idea_rejected':
        return `A ideia "${title}" de ${name} foi reprovada`;
      case 'idea_status_changed':
        return `${name} teve o status da ideia "${title}" alterado`;
      default:
        return `${name} realizou uma ação`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feed de Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Feed de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma atividade recente
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border">
                    {getActivityIcon(activity.action_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
