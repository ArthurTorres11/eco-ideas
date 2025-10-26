
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIdeas } from "@/features/ideas/contexts/IdeasContext";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, CheckCircle, Clock } from "lucide-react";
import { RankingPanel } from "@/features/ideas/components/RankingPanel";
import { ActivityFeed } from "@/features/ideas/components/ActivityFeed";

const categoryMap: { [key: string]: string } = {
  'water': 'Conservação de Água',
  'energy': 'Eficiência Energética', 
  'waste': 'Redução de Resíduos',
  'transport': 'Transporte Sustentável',
  'materials': 'Materiais Sustentáveis',
  'biodiversity': 'Biodiversidade'
};

export default function AdminDashboard() {
  const { ideas, loading } = useIdeas();
  const [userCount, setUserCount] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    fetchUserCount();
  }, []);

  const fetchUserCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setUserCount(count);
      }
    } catch (error) {
      console.error('Error fetching user count:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Calculate dynamic KPIs
  const pendingIdeas = ideas.filter(idea => idea.status === 'Em Análise').length;
  const approvedIdeas = ideas.filter(idea => idea.status === 'Aprovada').length;
  const totalIdeas = ideas.length;
  const approvalRate = totalIdeas > 0 ? Math.round((approvedIdeas / totalIdeas) * 100) : 0;

  // Calculate chart data based on real ideas
  const chartData = Object.entries(categoryMap).map(([key, name]) => ({
    categoria: name,
    ideias: ideas.filter(idea => idea.category === key).length
  })).filter(item => item.ideias > 0);

  // Get recent ideas (last 5)
  const recentIdeas = ideas.slice(0, 5);

  const kpiData = [
    { 
      title: "Ideias Pendentes de Análise", 
      value: pendingIdeas.toString(), 
      change: `${pendingIdeas} aguardando`,
      icon: <Clock className="w-5 h-5 text-yellow-500" />
    },
    { 
      title: "Total de Ideias Aprovadas", 
      value: approvedIdeas.toString(), 
      change: `${approvalRate}% aprovação`,
      icon: <CheckCircle className="w-5 h-5 text-green-500" />
    },
    { 
      title: "Total de Usuários", 
      value: loadingUsers ? "..." : userCount.toString(), 
      change: "usuários cadastrados",
      icon: <Users className="w-5 h-5 text-blue-500" />
    },
    { 
      title: "Total de Ideias", 
      value: totalIdeas.toString(), 
      change: `${ideas.length} submetidas`,
      icon: <TrendingUp className="w-5 h-5 text-purple-500" />
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Painel de Controle</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                {kpi.icon}
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <p className="text-xs text-gray-500 mt-1">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Ideias por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-500">Carregando dados...</p>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ideias" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-500">Nenhuma ideia cadastrada ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Ideas Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Últimas 5 Ideias Submetidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">Carregando ideias...</p>
              </div>
            ) : recentIdeas.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentIdeas.map((idea) => (
                    <TableRow key={idea.id}>
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate">{idea.title}</div>
                      </TableCell>
                      <TableCell>{idea.author}</TableCell>
                      <TableCell>
                        <Badge variant={
                          idea.status === 'Aprovada' ? 'default' : 
                          idea.status === 'Em Análise' ? 'secondary' : 
                          'destructive'
                        }>
                          {idea.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {idea.created_at}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">Nenhuma ideia cadastrada ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nova seção: Ranking e Atividades */}
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <RankingPanel />
        <ActivityFeed />
      </div>
    </div>
  );
}
