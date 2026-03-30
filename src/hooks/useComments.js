import { base44 } from '@/api/localStorageClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useComments(componentId) {
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', componentId],
    queryFn: () =>
      componentId
        ? base44.entities.Comment.filter({ component_id: componentId })
        : Promise.resolve([]),
    enabled: !!componentId,
    initialData: [],
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', componentId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.Comment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', componentId] });
    },
  });

  const createComment = (data) => createCommentMutation.mutate(data);
  const deleteComment = (id) => deleteCommentMutation.mutate(id);

  return {
    comments,
    createComment,
    deleteComment,
    createCommentMutation,
    deleteCommentMutation,
  };
}
