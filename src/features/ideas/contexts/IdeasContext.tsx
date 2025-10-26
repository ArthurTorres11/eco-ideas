import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/contexts/AuthContext';

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'Em Análise' | 'Aprovada' | 'Reprovada';
  created_at: string;
  impact: string;
  user_id: string;
  author: string;
  file_url?: string;
  file_name?: string;
}

interface IdeasContextType {
  ideas: Idea[];
  loading: boolean;
  addIdea: (idea: {
    title: string;
    description: string;
    category: string;
    impact: string;
    file?: File;
  }) => Promise<{ success: boolean; error?: string }>;
  updateIdeaStatus: (ideaId: string, status: Idea['status']) => Promise<{ success: boolean; error?: string }>;
  getUserIdeas: () => Idea[];
  getAllIdeas: () => Idea[];
  refreshIdeas: () => Promise<void>;
}

const IdeasContext = createContext<IdeasContextType | undefined>(undefined);

export const useIdeas = () => {
  const context = useContext(IdeasContext);
  if (context === undefined) {
    throw new Error('useIdeas must be used within an IdeasProvider');
  }
  return context;
};

interface IdeasProviderProps {
  children: ReactNode;
}

export const IdeasProvider = ({ children }: IdeasProviderProps) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, session } = useAuth();

  useEffect(() => {
    if (session && user) {
      refreshIdeas();
    }
  }, [session, user]);

  const refreshIdeas = async () => {
    if (!session || !user?.id) return;
    
    console.log('Refreshing ideas for user:', { 
      userId: user.id, 
      role: user.role, 
      isAdmin: user.role === 'admin' 
    });
    
    setLoading(true);
    try {
      // Simplified query without join for better performance
      let query = supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false });

      // If user is not admin, only show their own ideas
      if (user?.role !== 'admin') {
        console.log('Filtering ideas for user:', user?.id); // Debug log
        query = query.eq('user_id', user.id);
      } else {
        console.log('Admin user - showing all ideas'); // Debug log
      }

      const { data: ideasData, error: ideasError } = await query;

      if (ideasError) {
        console.error('Error fetching ideas:', ideasError);
        return;
      }

      console.log('Ideas fetched:', ideasData?.length || 0); // Debug log

      // Fetch profiles separately for better performance
      const userIds = [...new Set(ideasData?.map(idea => idea.user_id) || [])];
      let profiles: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', userIds);
        
        if (!profilesError) {
          profiles = profilesData || [];
        }
      }

      // Create a map for quick profile lookup
      const profileMap = profiles.reduce((acc, profile) => {
        acc[profile.user_id] = profile.name;
        return acc;
      }, {});

      const formattedIdeas: Idea[] = (ideasData || []).map(idea => ({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        category: idea.category,
        status: idea.status as 'Em Análise' | 'Aprovada' | 'Reprovada',
        created_at: new Date(idea.created_at).toLocaleDateString('pt-BR'),
        impact: idea.impact,
        user_id: idea.user_id,
        author: profileMap[idea.user_id] || 'Usuário',
        file_url: idea.file_url,
        file_name: idea.file_name
      }));

      setIdeas(formattedIdeas);
    } catch (error) {
      console.error('Error refreshing ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const addIdea = async (ideaData: {
    title: string;
    description: string;
    category: string;
    impact: string;
    file?: File;
  }) => {
    if (!session || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setLoading(true);
    try {
      let fileUrl = null;
      let fileName = null;

      // Upload file if provided
      if (ideaData.file) {
        const fileExt = ideaData.file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('idea-files')
          .upload(filePath, ideaData.file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          return { success: false, error: 'Erro ao fazer upload do arquivo' };
        }

        const { data: urlData } = supabase.storage
          .from('idea-files')
          .getPublicUrl(filePath);
        
        fileUrl = urlData.publicUrl;
        fileName = ideaData.file.name;
      }

      const { data, error } = await supabase
        .from('ideas')
        .insert({
          title: ideaData.title,
          description: ideaData.description,
          category: ideaData.category,
          impact: ideaData.impact,
          user_id: user.id,
          file_url: fileUrl,
          file_name: fileName
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding idea:', error);
        return { success: false, error: 'Erro ao adicionar ideia' };
      }

      // Add the new idea to the existing array for immediate update
      const newIdea: Idea = {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category,
        status: data.status as 'Em Análise' | 'Aprovada' | 'Reprovada',
        created_at: new Date(data.created_at).toLocaleDateString('pt-BR'),
        impact: data.impact,
        user_id: data.user_id,
        author: user.name || 'Usuário',
        file_url: data.file_url,
        file_name: data.file_name
      };

      setIdeas(prevIdeas => [newIdea, ...prevIdeas]);
      return { success: true };
    } catch (error) {
      console.error('Error adding idea:', error);
      return { success: false, error: 'Erro interno' };
    } finally {
      setLoading(false);
    }
  };

  const updateIdeaStatus = async (ideaId: string, status: Idea['status']) => {
    if (!session || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      const { error } = await supabase
        .from('ideas')
        .update({ status })
        .eq('id', ideaId);

      if (error) {
        console.error('Error updating idea status:', error);
        return { success: false, error: 'Erro ao atualizar status' };
      }

      // Update the idea in the local state for immediate feedback
      setIdeas(prevIdeas => 
        prevIdeas.map(idea => 
          idea.id === ideaId ? { ...idea, status } : idea
        )
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error updating idea status:', error);
      return { success: false, error: 'Erro interno' };
    }
  };

  const getUserIdeas = () => {
    if (!user) return [];
    return ideas.filter(idea => idea.user_id === user.id);
  };

  const getAllIdeas = () => {
    return ideas;
  };

  return (
    <IdeasContext.Provider value={{ 
      ideas, 
      loading,
      addIdea, 
      updateIdeaStatus, 
      getUserIdeas, 
      getAllIdeas,
      refreshIdeas
    }}>
      {children}
    </IdeasContext.Provider>
  );
};