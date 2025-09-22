import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DatabaseService, User, Conversation } from "@/lib/database";

// Query keys
export const queryKeys = {
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  conversations: (userId: string) => ['conversations', userId] as const,
  conversation: (id: string) => ['conversations', 'detail', id] as const,
};

// User hooks
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: DatabaseService.getAllUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => DatabaseService.getUserById(userId),
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, password }: { name: string; password: string }) =>
      DatabaseService.createUser(name, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<User> }) =>
      DatabaseService.updateUser(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => DatabaseService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
}

// Conversation hooks
export function useConversations(userId: string) {
  return useQuery({
    queryKey: queryKeys.conversations(userId),
    queryFn: () => DatabaseService.getConversationsByUserId(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useConversation(conversationId: string) {
  return useQuery({
    queryKey: queryKeys.conversation(conversationId),
    queryFn: () => DatabaseService.getConversationById(conversationId),
    enabled: !!conversationId,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      title,
      messages,
      model
    }: {
      userId: string;
      title: string;
      messages: any[];
      model: string;
    }) => DatabaseService.createConversation(userId, title, messages, model),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations(userId) });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates
    }: {
      id: string;
      updates: Partial<Conversation>
    }) => DatabaseService.updateConversation(id, updates),
    onSuccess: (_, { id }) => {
      // Find the conversation to get userId for invalidation
      const conversation = queryClient.getQueryData<Conversation>(queryKeys.conversation(id));
      if (conversation) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations(conversation.userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.conversation(id) });
      }
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => DatabaseService.deleteConversation(id),
    onSuccess: () => {
      // Invalidate all conversation queries since we don't know the userId
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Utility hooks
export function useClearAllData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: DatabaseService.clearAllData,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}