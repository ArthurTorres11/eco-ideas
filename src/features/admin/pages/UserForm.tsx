
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UserForm() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(userId && userId !== "new");
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    registro: "",
    senha: "",
    perfil: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log("Saving user:", formData);
    // Here you would typically save to your backend
    navigate("/admin/users");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">
        {isEditing ? "Editar Colaborador" : "Cadastrar Novo Colaborador"}
      </h1>
      
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            {isEditing ? "Editar Informações" : "Informações do Colaborador"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <Input
              value={formData.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
              placeholder="Digite o nome completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Digite o email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF (apenas números)
            </label>
            <Input
              value={formData.cpf}
              onChange={(e) => handleInputChange("cpf", e.target.value)}
              placeholder="12345678900"
              maxLength={11}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registro da Empresa (Opcional)
            </label>
            <Input
              value={formData.registro}
              onChange={(e) => handleInputChange("registro", e.target.value)}
              placeholder="Digite o registro da empresa"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha Provisória
              </label>
              <Input
                type="password"
                value={formData.senha}
                onChange={(e) => handleInputChange("senha", e.target.value)}
                placeholder="Digite uma senha provisória"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Perfil
            </label>
            <Select value={formData.perfil} onValueChange={(value) => handleInputChange("perfil", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ROLE_COLABORADOR">ROLE_COLABORADOR</SelectItem>
                <SelectItem value="ROLE_GESTOR">ROLE_GESTOR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700"
            >
              Salvar Usuário
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/users")}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
