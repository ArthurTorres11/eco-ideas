-- Primeiro, vamos popular a tabela user_points com dados das ideias existentes
INSERT INTO public.user_points (user_id, total_points, ideas_approved, ideas_submitted)
SELECT 
  i.user_id,
  COUNT(CASE WHEN i.status = 'Aprovada' THEN 1 END) * 100 as total_points,
  COUNT(CASE WHEN i.status = 'Aprovada' THEN 1 END) as ideas_approved,
  COUNT(*) as ideas_submitted
FROM public.ideas i
GROUP BY i.user_id
ON CONFLICT (user_id) 
DO UPDATE SET
  total_points = EXCLUDED.total_points,
  ideas_approved = EXCLUDED.ideas_approved,
  ideas_submitted = EXCLUDED.ideas_submitted,
  updated_at = now();

-- Atualizar função para criar atividade e atualizar pontos quando ideia é aprovada
CREATE OR REPLACE FUNCTION public.update_user_points_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Aprovada' AND (OLD.status IS NULL OR OLD.status != 'Aprovada') THEN
    -- Inserir ou atualizar pontos do usuário
    INSERT INTO public.user_points (user_id, total_points, ideas_approved, ideas_submitted)
    VALUES (
      NEW.user_id, 
      100,
      1,
      (SELECT COUNT(*) FROM public.ideas WHERE user_id = NEW.user_id)
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_points = user_points.total_points + 100,
      ideas_approved = user_points.ideas_approved + 1,
      ideas_submitted = (SELECT COUNT(*) FROM public.ideas WHERE user_id = NEW.user_id),
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

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_idea_status_change ON public.ideas;
CREATE TRIGGER on_idea_status_change
  AFTER UPDATE ON public.ideas
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_user_points_on_approval();

-- Também criar pontos quando nova ideia é criada
CREATE OR REPLACE FUNCTION public.update_user_points_on_create()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_points (user_id, total_points, ideas_submitted)
  VALUES (NEW.user_id, 0, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    ideas_submitted = user_points.ideas_submitted + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_idea_created_points ON public.ideas;
CREATE TRIGGER on_idea_created_points
  AFTER INSERT ON public.ideas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_points_on_create();