import { base44 } from '@/api/localStorageClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useFolders() {
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: () => base44.entities.Folder.list(),
    initialData: [],
  });

  const createFolderMutation = useMutation({
    mutationFn: (name) => base44.entities.Folder.create({ name: name || 'New Folder' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Folder.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['folders'] });
      const previousFolders = queryClient.getQueryData(['folders']);
      queryClient.setQueryData(['folders'], (old) =>
        old ? old.map((f) => (f.id === id ? { ...f, ...data } : f)) : []
      );
      return { previousFolders };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['folders'], context.previousFolders);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id) => {
      const components = await base44.entities.Component.filter({ folder_id: id });
      await Promise.all(components.map((c) => base44.entities.Component.delete(c.id)));
      await base44.entities.Folder.delete(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['folders'] });
      await queryClient.cancelQueries({ queryKey: ['components'] });
      const previousFolders = queryClient.getQueryData(['folders']);
      const previousComponents = queryClient.getQueryData(['components']);
      queryClient.setQueryData(['folders'], (old) =>
        old ? old.filter((f) => f.id !== id) : []
      );
      queryClient.setQueryData(['components'], (old) =>
        old ? old.filter((c) => c.folder_id !== id) : []
      );
      return { previousFolders, previousComponents };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['folders'], context.previousFolders);
      queryClient.setQueryData(['components'], context.previousComponents);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
  });

  const createFolder = (name) => createFolderMutation.mutate(name);
  const updateFolder = (id, data) => updateFolderMutation.mutate({ id, data });
  const deleteFolder = (id) => deleteFolderMutation.mutate(id);

  const ensureGeneralFolder = () => {
    if (folders.length === 0) {
      createFolder('General');
    }
  };

  return {
    folders,
    createFolder,
    updateFolder,
    deleteFolder,
    ensureGeneralFolder,
    createFolderMutation,
    updateFolderMutation,
    deleteFolderMutation,
  };
}
