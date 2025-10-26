import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserRanking {
  user_id: string;
  total_points: number;
  ideas_submitted: number;
  ideas_approved: number;
  ideas_implemented: number;
  profile_name?: string;
  profile_email?: string;
}

export const RankingPanel = () => {
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      console.log('Buscando ranking de usuários...');
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(10);

      console.log('Dados de pontos:', pointsData);
      if (pointsError) {
        console.error('Erro ao buscar pontos:', pointsError);
        throw pointsError;
      }

      if (!pointsData || pointsData.length === 0) {
        console.log('Nenhum dado de pontos encontrado');
        setRankings([]);
        setLoading(false);
        return;
      }

      // Buscar perfis separadamente
      const userIds = pointsData?.map(p => p.user_id) || [];
      console.log('User IDs:', userIds);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);

      console.log('Dados de perfis:', profilesData);
      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        throw profilesError;
      }

      // Combinar dados
      const combined = pointsData?.map(points => {
        const profile = profilesData?.find(p => p.user_id === points.user_id);
        return {
          ...points,
          profile_name: profile?.name || 'Usuário',
          profile_email: profile?.email || '',
        };
      });

      console.log('Dados combinados:', combined);
      setRankings(combined || []);
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground">#{index + 1}</span>;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ranking de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-3 bg-muted rounded w-24" />
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
          <TrendingUp className="h-5 w-5 text-primary" />
          Ranking de Usuários
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rankings.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum usuário com pontos ainda
          </p>
        ) : (
          <div className="space-y-3">
            {rankings.map((user, index) => (
              <div
                key={user.user_id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-accent ${
                  index < 3 ? 'bg-accent/50' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-border">
                  {getRankIcon(index)}
                </div>

                <Avatar className="h-10 w-10">
                  <AvatarFallback className={`
                    ${index === 0 ? 'bg-yellow-500/20 text-yellow-700' : ''}
                    ${index === 1 ? 'bg-gray-400/20 text-gray-700' : ''}
                    ${index === 2 ? 'bg-amber-600/20 text-amber-700' : ''}
                  `}>
                    {getInitials(user.profile_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.profile_name || 'Usuário'}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {user.total_points} pts
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {user.ideas_approved} aprovadas
                    </Badge>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {user.total_points}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.ideas_submitted} ideias
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
