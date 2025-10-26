
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/shared/Header";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { useIdeas } from "@/features/ideas/contexts/IdeasContext";
import { useCategories } from "@/features/ideas/hooks/useCategories";

const NewIdeaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addIdea } = useIdeas();
  const { categories } = useCategories();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    impactValue: "",
    unit: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para submeter uma ideia.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Create impact string
    let impactString = "Impacto estimado";
    if (formData.impactValue && formData.unit) {
      impactString = `${formData.impactValue} ${formData.unit}`;
    }

    // Add idea to Supabase
    const result = await addIdea({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      impact: impactString,
      file: file || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Ideia enviada com sucesso!",
        description: "Sua eco-ideia foi submetida para análise.",
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao enviar ideia.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-3xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-800 text-center">
              Qual é a sua Eco-Ideia?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-base font-medium">
                  Título da Ideia *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Digite o título da sua ideia..."
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-base font-medium">
                  Descrição Detalhada da Ideia *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Descreva sua ideia em detalhes..."
                  className="mt-2 min-h-32"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-base font-medium">
                  Principal Categoria de Impacto *
                </Label>
                <Select onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione uma categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="impact-value" className="text-base font-medium">
                    Valor do Impacto
                  </Label>
                  <Input
                    id="impact-value"
                    type="number"
                    value={formData.impactValue}
                    onChange={(e) => handleInputChange("impactValue", e.target.value)}
                    placeholder="0"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="unit" className="text-base font-medium">
                    Unidade de Medida
                  </Label>
                  <Select onValueChange={(value) => handleInputChange("unit", value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.unit}>
                          {category.unit}
                        </SelectItem>
                      ))}
                      <SelectItem value="percent">Porcentagem (%)</SelectItem>
                      <SelectItem value="units">Unidades</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="file" className="text-base font-medium">
                  Arquivo Anexo (opcional)
                </Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-2"
                  accept="image/*,.pdf,.doc,.docx"
                />
                {file && (
                  <p className="text-sm text-gray-600 mt-1">
                    Arquivo selecionado: {file.name}
                  </p>
                )}
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6 h-auto"
                >
                  {isSubmitting ? "Enviando..." : "Enviar Minha Ideia"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewIdeaPage;
