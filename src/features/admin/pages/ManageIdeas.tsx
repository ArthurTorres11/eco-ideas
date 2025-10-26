
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useIdeas } from "@/features/ideas/contexts/IdeasContext";
import { Eye, Download } from "lucide-react";

const statusColors = {
  "Em Análise": "bg-yellow-100 text-yellow-800",
  "Aprovada": "bg-green-100 text-green-800",
  "Reprovada": "bg-red-100 text-red-800",
};

const categoryMap: { [key: string]: string } = {
  'water': 'Conservação de Água',
  'energy': 'Eficiência Energética', 
  'waste': 'Redução de Resíduos',
  'transport': 'Transporte Sustentável',
  'materials': 'Materiais Sustentáveis',
  'biodiversity': 'Biodiversidade'
};

export default function ManageIdeas() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { ideas, loading, updateIdeaStatus } = useIdeas();

  const filteredIdeas = ideas.filter((idea) => {
    const categoryMatch = categoryFilter === "all" || idea.category === categoryFilter;
    const statusMatch = statusFilter === "all" || idea.status === statusFilter;
    return categoryMatch && statusMatch;
  });

  const handleEvaluate = (ideaId: string) => {
    navigate(`/admin/ideas/${ideaId}/evaluate`);
  };

  const handleQuickStatusUpdate = async (ideaId: string, newStatus: 'Em Análise' | 'Aprovada' | 'Reprovada') => {
    const result = await updateIdeaStatus(ideaId, newStatus);
    if (result.success) {
      toast({
        title: "Status atualizado!",
        description: `Ideia marcada como ${newStatus.toLowerCase()}.`,
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao atualizar status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Ideias</h1>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Todas as Ideias</CardTitle>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Aprovada">Aprovada</SelectItem>
                  <SelectItem value="Reprovada">Reprovada</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  <SelectItem value="water">Conservação de Água</SelectItem>
                  <SelectItem value="energy">Eficiência Energética</SelectItem>
                  <SelectItem value="waste">Redução de Resíduos</SelectItem>
                  <SelectItem value="transport">Transporte Sustentável</SelectItem>
                  <SelectItem value="materials">Materiais Sustentáveis</SelectItem>
                  <SelectItem value="biodiversity">Biodiversidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data de Submissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando ideias...
                  </TableCell>
                </TableRow>
              ) : filteredIdeas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Nenhuma ideia encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredIdeas.map((idea) => (
                  <TableRow key={idea.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div>
                        <p className="truncate">{idea.title}</p>
                        <p className="text-xs text-gray-500 truncate">{idea.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>{idea.author}</TableCell>
                    <TableCell>{categoryMap[idea.category] || idea.category}</TableCell>
                    <TableCell>{idea.created_at}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[idea.status as keyof typeof statusColors]}`}>
                        {idea.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {idea.file_url ? (
                        <a
                          href={idea.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <Download className="w-4 h-4" />
                          {idea.file_name}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">Sem arquivo</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEvaluate(idea.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        {idea.status === 'Em Análise' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleQuickStatusUpdate(idea.id, 'Aprovada')}
                            >
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleQuickStatusUpdate(idea.id, 'Reprovada')}
                            >
                              Reprovar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
