export enum Role {
  VIEWER = 'VIEWER',
  USER = 'USER',
  OPERATOR = 'OPERATOR',
  ADMIN = 'ADMIN',
}

export interface UserWithRole {
  id: string;
  email: string;
  name?: string;
  role?: Role;
}