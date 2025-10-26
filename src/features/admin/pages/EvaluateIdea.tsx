import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Download, FileText, Calendar, User, Tag, Target, ArrowLeft } from "lucide-react";
import { useIdeas } from "@/features/ideas/contexts/IdeasContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="text-2xl hover:scale-110 transition-transform"
        >
          <Star
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const createNotification = async (userId: string, title: string, message: string, type: string) => {
  try {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type
      });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export default function EvaluateIdea() {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const { ideas, updateIdeaStatus } = useIdeas();
  const [idea, setIdea] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    // Buscar a ideia específica pelos dados reais
    const foundIdea = ideas.find(i => i.id === ideaId);
    if (foundIdea) {
      setIdea(foundIdea);
      setStatus(foundIdea.status);
    }
  }, [ideaId, ideas]);

  const handleSaveEvaluation = async () => {
    if (!status) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um status para a ideia.",
        variant: "destructive",
      });
      return;
    }

    const result = await updateIdeaStatus(ideaId!, status as any);
    
    if (result.success) {
      // Criar notificação para o usuário
      let notificationTitle = "";
      let notificationMessage = "";
      let notificationType = "info";

      if (status === "Aprovada") {
        notificationTitle = "🎉 Ideia Aprovada!";
        notificationMessage = `Sua ideia "${idea.title}" foi aprovada pela administração!`;
        notificationType = "success";
      } else if (status === "Reprovada") {
        notificationTitle = "❌ Ideia Reprovada";
        notificationMessage = `Sua ideia "${idea.title}" foi reprovada. ${comments ? 'Comentários: ' + comments : ''}`;
        notificationType = "error";
      }

      if (notificationTitle) {
        await createNotification(idea.user_id, notificationTitle, notificationMessage, notificationType);
      }

      toast({
        title: "Sucesso!",
        description: "Avaliação salva com sucesso.",
      });
      
      navigate("/admin/ideas");
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao salvar avaliação.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = () => {
    if (idea.file_url) {
      window.open(idea.file_url, '_blank');
    }
  };

  if (!idea) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando ideia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/ideas")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avaliação de Ideia</h1>
          <p className="text-gray-600 mt-1">Revise e avalie a proposta submetida</p>
        </div>
      </div>
      
      {/* Idea Details Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                {idea.title}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{idea.author}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{idea.created_at}</span>
                </div>
              </div>
            </div>
            <Badge 
              className={`${
                idea.status === 'Aprovada' ? 'bg-green-100 text-green-800' :
                idea.status === 'Reprovada' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}
            >
              {idea.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Descrição da Ideia
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 leading-relaxed">{idea.description}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-blue-900">Categoria</h4>
              </div>
              <p className="text-blue-700 font-medium">{idea.category}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-green-900">Impacto Estimado</h4>
              </div>
              <p className="text-green-700 font-medium">{idea.impact}</p>
            </div>

            {idea.file_url && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <h4 className="font-medium text-purple-900">Anexo</h4>
                </div>
                <Button
                  onClick={handleDownloadFile}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center gap-2 text-purple-700 border-purple-300 hover:bg-purple-100"
                >
                  <Download className="w-4 h-4" />
                  {idea.file_name || 'Download'}
                </Button>
              </div>
            )}
          </div>

          {/* Evaluation Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Seção de Avaliação
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block font-medium text-gray-900 mb-3">
                    Status da Ideia
                  </label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aprovada">✅ Aprovar Ideia</SelectItem>
                      <SelectItem value="Reprovada">❌ Reprovar Ideia</SelectItem>
                      <SelectItem value="Em Análise">⏳ Manter em Análise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block font-medium text-gray-900 mb-3">
                    Avaliação (Opcional)
                  </label>
                  <div className="flex items-center gap-3">
                    <StarRating rating={rating} onRatingChange={setRating} />
                    <span className="text-sm text-gray-600">
                      {rating > 0 ? `${rating}/5 estrelas` : 'Sem avaliação'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block font-medium text-gray-900 mb-3">
                  Comentários e Feedback
                </label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Adicione comentários, sugestões ou justificativas para sua decisão..."
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6">
              <Button
                onClick={handleSaveEvaluation}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium text-lg"
                disabled={!status}
              >
                💾 Salvar Avaliação e Notificar Usuário
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}