import { base44 } from '@/api/localStorageClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useStickyNotes() {
  const queryClient = useQueryClient();

  const { data: stickyNotes = [] } = useQuery({
    queryKey: ['stickyNotes'],
    queryFn: () => base44.entities.StickyNote.list(),
    initialData: [],
  });

  const createStickyNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.StickyNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stickyNotes'] });
    },
  });

  const deleteStickyNoteMutation = useMutation({
    mutationFn: (id) => base44.entities.StickyNote.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['stickyNotes'] });
      const previousStickyNotes = queryClient.getQueryData(['stickyNotes']);
      queryClient.setQueryData(['stickyNotes'], (old) =>
        old ? old.filter((n) => n.id !== id) : []
      );
      return { previousStickyNotes };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['stickyNotes'], context.previousStickyNotes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['stickyNotes'] });
    },
  });

  const createStickyNote = (data) => createStickyNoteMutation.mutate(data);
  const deleteStickyNote = (id) => deleteStickyNoteMutation.mutate(id);

  // Fire-and-forget persist — writes to storage without triggering React Query
  const silentUpdateStickyNote = (id, data) => base44.entities.StickyNote.update(id, data);
  const silentCreateStickyNote = (data) => base44.entities.StickyNote.create(data);
  const silentDeleteStickyNote = (id) => base44.entities.StickyNote.delete(id);

  return {
    stickyNotes,
    createStickyNote,
    deleteStickyNote,
    silentUpdateStickyNote,
    silentCreateStickyNote,
    silentDeleteStickyNote,
    createStickyNoteMutation,
    deleteStickyNoteMutation,
  };
}
