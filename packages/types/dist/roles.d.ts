export declare enum Role {
    VIEWER = "VIEWER",
    USER = "USER",
    ADMIN = "ADMIN"
}
export interface UserWithRole {
    id: string;
    email: string;
    name?: string;
    role?: Role;
}
