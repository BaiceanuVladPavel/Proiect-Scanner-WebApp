export type AuthUser = {
  id: number;
  username: string;
  is_staff: boolean;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type LoginResponse = AuthTokens & {
  user: AuthUser;
};
