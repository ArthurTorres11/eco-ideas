# Sistema de Gestão de Eco-Ideias

## 📋 Sobre o Projeto

Sistema web desenvolvido como Trabalho de Conclusão de Curso (TCC) do curso de Engenharia da Computação. A plataforma permite o cadastro, avaliação e gestão de ideias sustentáveis, promovendo o engajamento em práticas eco-friendly através de gamificação e análise por inteligência artificial.

## 🎯 Funcionalidades Principais

### Para Usuários
- **Cadastro de Ideias**: Submissão de propostas sustentáveis com descrição, categoria e impacto esperado
- **Dashboard Personalizado**: Visualização de estatísticas e acompanhamento de ideias submetidas
- **Assistente IA de Sustentabilidade**: Chat interativo com IA especializada em questões ambientais
- **Sistema de Pontos**: Gamificação baseada no impacto e aprovação das ideias
- **Notificações em Tempo Real**: Atualizações sobre status das ideias e feedback da administração
- **Relatórios**: Visualização de métricas e estatísticas das contribuições

### Para Administradores
- **Avaliação de Ideias**: Sistema de análise e aprovação com IA integrada
- **Gestão de Usuários**: Controle completo de usuários e permissões
- **Configuração de Metas**: Definição de objetivos e categorias de sustentabilidade
- **Ranking e Análises**: Visualização de rankings e métricas globais do sistema
- **Análise por IA**: Sugestões automáticas de melhorias e detecção de similaridades entre ideias
- **Exportação de Dados**: Geração de relatórios em diversos formatos

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca para construção de interfaces
- **TypeScript** - Superset JavaScript com tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI reutilizáveis
- **React Router** - Navegação e roteamento
- **TanStack Query** - Gerenciamento de estado assíncrono

### Backend
- **Supabase** - Backend as a Service (BaaS)
  - Autenticação e autorização
  - Banco de dados PostgreSQL
  - Storage para arquivos
  - Edge Functions (Deno)
  - Row Level Security (RLS)

### Inteligência Artificial
- **API de IA** - Análise de ideias e chat de sustentabilidade
- **Processamento de Linguagem Natural** - Análise de similaridade e sugestões

### Build e Deploy
- **Vite** - Build tool e dev server
- **Docker** - Containerização
- **Nginx** - Servidor web para produção

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
```bash
git clone <URL_DO_REPOSITORIO>
cd <NOME_DO_PROJETO>
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas credenciais do Supabase.

4. **Execute o projeto em modo de desenvolvimento**
```bash
npm run dev
```

5. **Acesse a aplicação**
```
http://localhost:8080
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/        # Componentes reutilizáveis
│   ├── shared/       # Componentes compartilhados
│   └── ui/           # Componentes de interface base
├── features/         # Funcionalidades por módulo
│   ├── admin/        # Área administrativa
│   ├── auth/         # Autenticação e autorização
│   └── ideas/        # Gestão de ideias
├── hooks/            # React hooks customizados
├── integrations/     # Integrações externas (Supabase)
├── layouts/          # Layouts de página
└── pages/            # Páginas principais

supabase/
├── functions/        # Edge Functions
└── migrations/       # Migrações de banco de dados
```

## 🔒 Segurança

- **Row Level Security (RLS)** ativado em todas as tabelas
- **Autenticação JWT** para proteção de rotas
- **Validação de permissões** em nível de aplicação e banco de dados
- **Proteção de Edge Functions** com verificação de usuário autenticado

## 📊 Banco de Dados

O sistema utiliza PostgreSQL via Supabase com as seguintes tabelas principais:
- `ideas` - Armazenamento de ideias sustentáveis
- `profiles` - Perfis de usuários
- `categories` - Categorias de sustentabilidade
- `goals` - Metas e objetivos
- `notifications` - Notificações do sistema

## 👥 Autores

**Trabalho de Conclusão de Curso - Engenharia da Computação**

- **Arthur Torres de Camargo de Oliveira** 
- **Flavio Farias do Nascimento** 
---
- **Trabalho orientado por: Marilda de Fatima**

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos como parte do Trabalho de Conclusão de Curso.

## 🙏 Agradecimentos

Agradecemos à instituição de ensino e aos professores orientadores pelo suporte durante o desenvolvimento deste projeto.
