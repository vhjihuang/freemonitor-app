export declare enum Role {
    USER = "USER",
    ADMIN = "ADMIN"
}
export interface UserWithRole {
    id: string;
    email: string;
    name?: string;
    role?: Role;
}
