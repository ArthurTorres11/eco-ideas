-- Garantir que o bucket para arquivos de ideias existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('idea-files', 'idea-files', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir inserção de arquivos por usuários autenticados
CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'idea-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política para permitir visualização de todos os arquivos (já que o bucket é público)
CREATE POLICY "Anyone can view idea files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'idea-files');