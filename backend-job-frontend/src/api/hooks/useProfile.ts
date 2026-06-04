import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountApi, type UpdateProfileRequest, type User } from '@/api';
import { queryKeys } from '@/api/queryKeys';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => accountApi.updateProfile(body),
    onSuccess: (user: User) => {
      queryClient.setQueryData(queryKeys.me.profile, user);
    },
  });
}
