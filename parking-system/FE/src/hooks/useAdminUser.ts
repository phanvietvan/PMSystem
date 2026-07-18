import { useCurrentUser } from './useCurrentUser';

/** Alias — admin pages chỉ cần user object. */
export function useAdminUser() {
  const { user } = useCurrentUser();
  return user;
}
