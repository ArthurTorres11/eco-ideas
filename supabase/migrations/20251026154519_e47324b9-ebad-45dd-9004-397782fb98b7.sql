-- Verificar e criar apenas tabelas que não existem

-- Tabela de atividades para feed (se não existir)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de anexos múltiplos (se não existir)
CREATE TABLE IF NOT EXISTS public.idea_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de workflow de aprovação (se não existir)
CREATE TABLE IF NOT EXISTS public.idea_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  review_stage TEXT NOT NULL,
  status TEXT NOT NULL,
  comments TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos de workflow na tabela ideas (apenas se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ideas' AND column_name='current_stage') THEN
    ALTER TABLE public.ideas ADD COLUMN current_stage TEXT DEFAULT 'initial';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ideas' AND column_name='workflow_status') THEN
    ALTER TABLE public.ideas ADD COLUMN workflow_status TEXT DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ideas' AND column_name='ai_suggestions') THEN
    ALTER TABLE public.ideas ADD COLUMN ai_suggestions JSONB DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ideas' AND column_name='similarity_score') THEN
    ALTER TABLE public.ideas ADD COLUMN similarity_score FLOAT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ideas' AND column_name='similar_ideas') THEN
    ALTER TABLE public.ideas ADD COLUMN similar_ideas JSONB DEFAULT '[]';
  END IF;
END $$;

-- Enable RLS nas novas tabelas
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para activities
DROP POLICY IF EXISTS "Users can view all activities" ON public.activities;
CREATE POLICY "Users can view all activities"
  ON public.activities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
CREATE POLICY "Users can create activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para idea_attachments
DROP POLICY IF EXISTS "Users can view attachments of ideas they can see" ON public.idea_attachments;
CREATE POLICY "Users can view attachments of ideas they can see"
  ON public.idea_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ideas 
      WHERE ideas.id = idea_attachments.idea_id 
      AND (ideas.user_id = auth.uid() OR is_current_user_admin())
    )
  );

DROP POLICY IF EXISTS "Users can add attachments to their ideas" ON public.idea_attachments;
CREATE POLICY "Users can add attachments to their ideas"
  ON public.idea_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ideas 
      WHERE ideas.id = idea_id 
      AND ideas.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all attachments" ON public.idea_attachments;
CREATE POLICY "Admins can manage all attachments"
  ON public.idea_attachments FOR ALL
  USING (is_current_user_admin());

-- Políticas RLS para idea_reviews
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.idea_reviews;
CREATE POLICY "Admins can view all reviews"
  ON public.idea_reviews FOR SELECT
  USING (is_current_user_admin());

DROP POLICY IF EXISTS "Users can view reviews of their ideas" ON public.idea_reviews;
CREATE POLICY "Users can view reviews of their ideas"
  ON public.idea_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ideas 
      WHERE ideas.id = idea_reviews.idea_id 
      AND ideas.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can create reviews" ON public.idea_reviews;
CREATE POLICY "Admins can create reviews"
  ON public.idea_reviews FOR INSERT
  WITH CHECK (is_current_user_admin());

DROP POLICY IF EXISTS "Admins can update reviews" ON public.idea_reviews;
CREATE POLICY "Admins can update reviews"
  ON public.idea_reviews FOR UPDATE
  USING (is_current_user_admin());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_idea_attachments_idea_id ON public.idea_attachments(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_reviews_idea_id ON public.idea_reviews(idea_id);

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

DROP TRIGGER IF EXISTS on_idea_created ON public.ideas;
CREATE TRIGGER on_idea_created
  AFTER INSERT ON public.ideas
  FOR EACH ROW
  EXECUTE FUNCTION public.create_idea_activity();

-- Função para criar atividade quando status muda
CREATE OR REPLACE FUNCTION public.create_status_change_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO public.activities (user_id, action_type, entity_type, entity_id, metadata)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'Aprovada' THEN 'idea_approved'
        WHEN NEW.status = 'Reprovada' THEN 'idea_rejected'
        ELSE 'idea_status_changed'
      END,
      'idea',
      NEW.id,
      jsonb_build_object('title', NEW.title, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_idea_status_change ON public.ideas;
CREATE TRIGGER on_idea_status_change
  AFTER UPDATE ON public.ideas
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.create_status_change_activity();