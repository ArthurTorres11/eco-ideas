
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Droplet, 
  Bolt, 
  Lightbulb, 
  Recycle, 
  Leaf, 
  Award,
  Star,
  TrendingUp,
  CheckCircle,
  Clock
} from "lucide-react";
import Header from "@/components/shared/Header";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { useIdeas } from "@/features/ideas/contexts/IdeasContext";
import { useGoals } from "@/features/ideas/hooks/useGoals";
import ChatPopup from "@/features/ideas/components/ChatPopup";
import { Plus } from "lucide-react";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { getUserIdeas } = useIdeas();
  const { goals } = useGoals();

  // Get user's ideas
  const userIdeas = getUserIdeas();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'water': return <Droplet className="w-5 h-5 text-blue-500" />;
      case 'transport': return <TrendingUp className="w-5 h-5 text-purple-500" />;
      case 'waste': return <Recycle className="w-5 h-5 text-orange-500" />;
      case 'energy': return <Bolt className="w-5 h-5 text-yellow-500" />;
      case 'materials': return <Recycle className="w-5 h-5 text-gray-500" />;
      case 'biodiversity': return <Leaf className="w-5 h-5 text-green-500" />;
      default: return <Leaf className="w-5 h-5 text-green-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    return status === "Aprovada" ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <Clock className="w-4 h-4 text-yellow-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aprovada": return "bg-green-100 text-green-800 border-green-200";
      case "Em Análise": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Reprovada": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const approvedIdeas = userIdeas.filter(idea => idea.status === 'Aprovada');
  const approvalRate = userIdeas.length > 0 ? Math.round((approvedIdeas.length / userIdeas.length) * 100) : 0;

  // Calculate real impact from approved ideas
  const calculateRealImpact = () => {
    let totalWater = 0; // em litros
    let totalEnergy = 0; // em kWh  
    let totalCO2 = 0; // em kg

    approvedIdeas.forEach(idea => {
      const impact = idea.impact.toLowerCase();
      
      // Extract number from impact string
      const numberMatch = impact.match(/(\d+(?:\.\d+)?)/);
      const value = numberMatch ? parseFloat(numberMatch[1]) : 0;

      // Categorize by unit and type
      if (impact.includes('l') || impact.includes('litro')) {
        totalWater += value;
      } else if (impact.includes('kwh') || impact.includes('energia')) {
        totalEnergy += value;
      } else if (impact.includes('kg') || impact.includes('co2') || impact.includes('carbono')) {
        totalCO2 += value;
      } else {
        // If no specific unit, categorize by idea category
        switch (idea.category) {
          case 'water':
            totalWater += value;
            break;
          case 'energy':
            totalEnergy += value;
            break;
          case 'waste':
          case 'transport':
          case 'materials':
          case 'biodiversity':
            totalCO2 += value;
            break;
          default:
            totalEnergy += value;
            break;
        }
      }
    });

    return { totalWater, totalEnergy, totalCO2 };
  };

  const { totalWater, totalEnergy, totalCO2 } = calculateRealImpact();

  // Calculate dynamic achievements based on user's ideas
  const getAchievements = () => {
    const achievements = [
      { 
        name: "Primeira Ideia", 
        icon: <Star className="w-4 h-4" />, 
        earned: userIdeas.length > 0 
      },
      { 
        name: "Eco Inovador", 
        icon: <Lightbulb className="w-4 h-4" />, 
        earned: approvedIdeas.length >= 2 
      },
      { 
        name: "Impacto Verde", 
        icon: <Leaf className="w-4 h-4" />, 
        earned: approvedIdeas.length >= 3 
      },
      { 
        name: "Super Colaborador", 
        icon: <Award className="w-4 h-4" />, 
        earned: userIdeas.length >= 5 
      },
    ];
    return achievements;
  };

  const achievements = getAchievements();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <Header />
      
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header & Call to Action */}
        <section className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">
              Bem-vindo, <span className="text-green-700">{user?.name || 'Usuário'}</span>!
            </h1>
            <p className="text-lg text-gray-600">
              Continue fazendo a diferença com suas ideias sustentáveis
            </p>
          </div>
          
          <div className="relative">
            <Button
              onClick={() => navigate("/new-idea")}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xl px-12 py-6 h-auto rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              size="lg"
            >
              <Lightbulb className="w-6 h-6 mr-3" />
              + Submeter Nova Ideia
            </Button>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* My Ideas Section */}
          <section className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-green-600" />
                Minhas Ideias
              </h2>
              <Badge variant="outline" className="text-green-700 border-green-200">
                {userIdeas.length} ideias
              </Badge>
            </div>

            <div className="space-y-4">
              {userIdeas.length > 0 ? (
                userIdeas.map((idea) => (
                  <Card key={idea.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 bg-gradient-to-r from-white to-green-50/30">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border">
                          {getCategoryIcon(idea.category)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {idea.title}
                            </h3>
                            <Badge className={`${getStatusColor(idea.status)} border flex items-center gap-1`}>
                              {getStatusIcon(idea.status)}
                              {idea.status}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {idea.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">{idea.created_at}</span>
                            <span className="text-green-600 font-medium">{idea.impact}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="p-8 text-center">
                    <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhuma ideia cadastrada ainda</h3>
                    <p className="text-gray-500 mb-4">Comece a fazer a diferença submetendo sua primeira eco-ideia!</p>
                    <Button
                      onClick={() => navigate("/new-idea")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Submeter Primeira Ideia
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          {/* Personal Impact Panel */}
          <section className="lg:col-span-4 space-y-6">
            {/* Impact Metrics */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Seu Impacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {approvedIdeas.length > 0 ? (
                  <>
                    {/* Water Impact */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Droplet className="w-5 h-5 text-blue-500" />
                          <span className="font-medium text-gray-700">Água economizada</span>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">
                          {totalWater > 0 ? `${totalWater.toLocaleString('pt-BR')}L` : '0L'}
                        </span>
                      </div>
                       <Progress value={Math.min((totalWater / (goals['goal_water_monthly'] || 10000)) * 100, 100)} className="h-3 bg-blue-100" />
                       <p className="text-xs text-gray-500">
                         {totalWater > 0 ? `${Math.min((totalWater / (goals['goal_water_monthly'] || 10000)) * 100, 100).toFixed(1)}% da meta mensal (${(goals['goal_water_monthly'] || 10000).toLocaleString('pt-BR')}L)` : 'Nenhuma economia registrada'}
                       </p>
                    </div>

                    {/* Energy Impact */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bolt className="w-5 h-5 text-yellow-500" />
                          <span className="font-medium text-gray-700">Energia poupada</span>
                        </div>
                        <span className="text-2xl font-bold text-yellow-600">
                          {totalEnergy > 0 ? `${totalEnergy.toLocaleString('pt-BR')} kWh` : '0 kWh'}
                        </span>
                      </div>
                       <Progress value={Math.min((totalEnergy / (goals['goal_energy_monthly'] || 1000)) * 100, 100)} className="h-3 bg-yellow-100" />
                       <p className="text-xs text-gray-500">
                         {totalEnergy > 0 ? `${Math.min((totalEnergy / (goals['goal_energy_monthly'] || 1000)) * 100, 100).toFixed(1)}% da meta mensal (${(goals['goal_energy_monthly'] || 1000).toLocaleString('pt-BR')} kWh)` : 'Nenhuma economia registrada'}
                       </p>
                    </div>

                    {/* CO2 Reduction */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Leaf className="w-5 h-5 text-green-500" />
                          <span className="font-medium text-gray-700">CO₂ reduzido</span>
                        </div>
                        <span className="text-2xl font-bold text-green-600">
                          {totalCO2 > 0 ? `${totalCO2.toLocaleString('pt-BR')} kg` : '0 kg'}
                        </span>
                      </div>
                       <Progress value={Math.min((totalCO2 / (goals['goal_waste_monthly'] || 500)) * 100, 100)} className="h-3 bg-green-100" />
                       <p className="text-xs text-gray-500">
                         {totalCO2 > 0 ? `${Math.min((totalCO2 / (goals['goal_waste_monthly'] || 500)) * 100, 100).toFixed(1)}% da meta mensal (${(goals['goal_waste_monthly'] || 500).toLocaleString('pt-BR')} kg)` : 'Nenhuma redução registrada'}
                       </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Seu impacto aparecerá aqui</h3>
                    <p className="text-gray-500">Submeta e aprove ideias para ver seu impacto ambiental!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Conquistas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        achievement.earned
                          ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                          : "bg-gray-50 border-gray-200 text-gray-400"
                      }`}
                    >
                      <div className="flex justify-center mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          achievement.earned ? "bg-yellow-100" : "bg-gray-100"
                        }`}>
                          {achievement.icon}
                        </div>
                      </div>
                      <p className="text-xs font-medium">{achievement.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-green-400">{approvedIdeas.length}</p>
                    <p className="text-sm text-gray-300">Ideias Aprovadas</p>
                  </div>
                  <div className="h-px bg-gray-700"></div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">{approvalRate}%</p>
                    <p className="text-sm text-gray-300">Taxa de Aprovação</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
          </section>
        </div>
        
        {/* Chat Popup */}
        <ChatPopup />
      </main>
    </div>
  );
};

export default DashboardPage;
