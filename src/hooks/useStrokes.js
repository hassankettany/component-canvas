import { base44 } from '@/api/localStorageClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useStrokes() {
  const queryClient = useQueryClient();

  const { data: strokes = [] } = useQuery({
    queryKey: ['strokes'],
    queryFn: () => base44.entities.Stroke.list(),
    initialData: [],
  });

  const createStrokeMutation = useMutation({
    mutationFn: (data) => base44.entities.Stroke.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strokes'] });
    },
  });

  const deleteStrokeMutation = useMutation({
    mutationFn: (id) => base44.entities.Stroke.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['strokes'] });
      const previousStrokes = queryClient.getQueryData(['strokes']);
      queryClient.setQueryData(['strokes'], (old) =>
        old ? old.filter((s) => s.id !== id) : []
      );
      return { previousStrokes };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['strokes'], context.previousStrokes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['strokes'] });
    },
  });

  const createStroke = (data) => createStrokeMutation.mutate(data);
  const deleteStroke = (id) => deleteStrokeMutation.mutate(id);

  // Fire-and-forget persist — writes to storage without triggering React Query
  const silentCreateStroke = (data) => base44.entities.Stroke.create(data);
  const silentDeleteStroke = (id) => base44.entities.Stroke.delete(id);

  return {
    strokes,
    createStroke,
    deleteStroke,
    silentCreateStroke,
    silentDeleteStroke,
    createStrokeMutation,
    deleteStrokeMutation,
  };
}
