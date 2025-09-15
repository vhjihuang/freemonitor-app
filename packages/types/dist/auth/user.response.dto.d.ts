import { Role } from '../roles';
export interface UserResponseDto {
    id: string;
    email: string;
    name?: string;
    role?: Role;
}
