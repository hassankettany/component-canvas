import { base44 } from '@/api/localStorageClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useComponents() {
  const queryClient = useQueryClient();

  const { data: components = [] } = useQuery({
    queryKey: ['components'],
    queryFn: () => base44.entities.Component.list(),
    initialData: [],
  });

  const createComponentMutation = useMutation({
    mutationFn: (data) => base44.entities.Component.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
  });

  const updateComponentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Component.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['components'] });
      const previousComponents = queryClient.getQueryData(['components']);
      queryClient.setQueryData(['components'], (old) =>
        old ? old.map((c) => (c.id === id ? { ...c, ...data } : c)) : []
      );
      return { previousComponents };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['components'], context.previousComponents);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
  });

  const batchUpdateComponentsMutation = useMutation({
    mutationFn: (updates) =>
      Promise.all(updates.map((u) => base44.entities.Component.update(u.id, u.data))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
  });

  const deleteComponentMutation = useMutation({
    mutationFn: async (id) => {
      const comments = await base44.entities.Comment.filter({ component_id: id });
      await Promise.all(comments.map((c) => base44.entities.Comment.delete(c.id)));
      await base44.entities.Component.delete(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['components'] });
      const previousComponents = queryClient.getQueryData(['components']);
      queryClient.setQueryData(['components'], (old) =>
        old ? old.filter((c) => c.id !== id) : []
      );
      return { previousComponents };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['components'], context.previousComponents);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
  });

  const createComponent = (data) => createComponentMutation.mutate(data);
  const updateComponent = (id, data) => updateComponentMutation.mutate({ id, data });
  const batchUpdateComponents = (updates) => batchUpdateComponentsMutation.mutate(updates);
  const deleteComponent = (id) => deleteComponentMutation.mutate(id);

  // Fire-and-forget persist — writes to storage without triggering React Query
  // refetches. Used by Canvas which maintains its own optimistic local state.
  const silentUpdate = (id, data) => base44.entities.Component.update(id, data);
  const silentBatchUpdate = (updates) =>
    Promise.all(updates.map((u) => base44.entities.Component.update(u.id, u.data)));

  return {
    components,
    createComponent,
    updateComponent,
    batchUpdateComponents,
    deleteComponent,
    silentUpdate,
    silentBatchUpdate,
    createComponentMutation,
    updateComponentMutation,
    batchUpdateComponentsMutation,
    deleteComponentMutation,
  };
}
