-- Tabela de pontos dos usuários para gamificação
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  ideas_submitted INTEGER NOT NULL DEFAULT 0,
  ideas_approved INTEGER NOT NULL DEFAULT 0,
  ideas_implemented INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de atividades para feed
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'idea_created', 'idea_approved', 'idea_rejected', 'comment_added', etc
  entity_type TEXT NOT NULL, -- 'idea', 'comment', etc
  entity_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de anexos múltiplos
CREATE TABLE public.idea_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de workflow de aprovação
CREATE TABLE public.idea_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  review_stage TEXT NOT NULL, -- 'initial', 'technical', 'financial', 'final'
  status TEXT NOT NULL, -- 'pending', 'approved', 'rejected', 'needs_info'
  comments TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos de workflow na tabela ideas
ALTER TABLE public.ideas 
ADD COLUMN current_stage TEXT DEFAULT 'initial',
ADD COLUMN workflow_status TEXT DEFAULT 'pending',
ADD COLUMN ai_suggestions JSONB DEFAULT '[]',
ADD COLUMN similarity_score FLOAT,
ADD COLUMN similar_ideas JSONB DEFAULT '[]';

-- Enable RLS nas novas tabelas
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_points
CREATE POLICY "Users can view their own points"
  ON public.user_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all points for ranking"
  ON public.user_points FOR SELECT
  USING (true);

CREATE POLICY "System can insert points"
  ON public.user_points FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update points"
  ON public.user_points FOR UPDATE
  USING (true);

-- Políticas RLS para activities
CREATE POLICY "Users can view all activities"
  ON public.activities FOR SELECT
  USING (true);

CREATE POLICY "Users can create activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para idea_attachments
CREATE POLICY "Users can view attachments of ideas they can see"
  ON public.idea_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ideas 
      WHERE ideas.id = idea_attachments.idea_id 
      AND (ideas.user_id = auth.uid() OR is_current_user_admin())
    )
  );

CREATE POLICY "Users can add attachments to their ideas"
  ON public.idea_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ideas 
      WHERE ideas.id = idea_id 
      AND ideas.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all attachments"
  ON public.idea_attachments FOR ALL
  USING (is_current_user_admin());

-- Políticas RLS para idea_reviews
CREATE POLICY "Admins can view all reviews"
  ON public.idea_reviews FOR SELECT
  USING (is_current_user_admin());

CREATE POLICY "Users can view reviews of their ideas"
  ON public.idea_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ideas 
      WHERE ideas.id = idea_reviews.idea_id 
      AND ideas.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create reviews"
  ON public.idea_reviews FOR INSERT
  WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can update reviews"
  ON public.idea_reviews FOR UPDATE
  USING (is_current_user_admin());

-- Índices para performance
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX idx_idea_attachments_idea_id ON public.idea_attachments(idea_id);
CREATE INDEX idx_idea_reviews_idea_id ON public.idea_reviews(idea_id);
CREATE INDEX idx_user_points_total ON public.user_points(total_points DESC);

-- Trigger para atualizar updated_at em user_points
CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON public.user_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar atividade automaticamente quando uma ideia é criada
CREATE OR REPLACE FUNCTION public.create_idea_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (user_id, action_type, entity_type, entity_id, metadata)
  VALUES (
    NEW.user_id,
    'idea_created',
    'idea',
    NEW.id,
    jsonb_build_object('title', NEW.title, 'category', NEW.category)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_idea_created
  AFTER INSERT ON public.ideas
  FOR EACH ROW
  EXECUTE FUNCTION public.create_idea_activity();

-- Função para atualizar pontos quando ideia é aprovada
CREATE OR REPLACE FUNCTION public.update_user_points_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Aprovada' AND OLD.status != 'Aprovada' THEN
    -- Inserir ou atualizar pontos do usuário
    INSERT INTO public.user_points (user_id, total_points, ideas_approved)
    VALUES (NEW.user_id, 100, 1)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_points = user_points.total_points + 100,
      ideas_approved = user_points.ideas_approved + 1,
      updated_at = now();
    
    -- Criar atividade
    INSERT INTO public.activities (user_id, action_type, entity_type, entity_id, metadata)
    VALUES (
      NEW.user_id,
      'idea_approved',
      'idea',
      NEW.id,
      jsonb_build_object('title', NEW.title, 'points_earned', 100)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_idea_status_change
  AFTER UPDATE ON public.ideas
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_user_points_on_approval();