
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Leaf } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/contexts/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, signup, user, loading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      // Admin vai direto para painel administrativo
      if (user.role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, loading, navigate]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen eco-bg flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (isSignup && !name)) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (isSignup) {
        const result = await signup(email, password, name);
        
        if (result.success) {
          toast({
            title: "Conta criada com sucesso!",
            description: "Verifique seu email para confirmar a conta.",
          });
          setIsSignup(false);
        } else {
          toast({
            title: "Erro",
            description: result.error || "Erro ao criar conta.",
            variant: "destructive",
          });
        }
      } else {
        const result = await login(email, password);
        
        if (result.success) {
          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo ao Eco-Ideias.",
          });
          // O redirecionamento será feito pelo useEffect quando user for atualizado
        } else {
          toast({
            title: "Erro",
            description: result.error || "Email ou senha incorretos.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro durante a operação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen eco-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 eco-green-light rounded-full flex items-center justify-center mb-4">
            <Leaf className="w-8 h-8 text-green-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isSignup ? "Criar Conta" : "Eco-Ideias"}
          </h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <Input
                  type="text"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              {isLoading ? (isSignup ? "Criando..." : "Entrando...") : (isSignup ? "Criar Conta" : "Entrar")}
            </Button>
            
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-sm text-green-700 hover:text-green-800 hover:underline"
              >
                {isSignup ? "Já tem conta? Fazer login" : "Não tem conta? Criar conta"}
              </button>
              
              {!isSignup && (
                <div>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm text-green-700 hover:text-green-800 hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}
            </div>
            
            {!isSignup && (
              <div className="text-center text-xs text-gray-500 mt-4">
                <p>Demo Admin: admin@eco-ideias.com / admin123</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
