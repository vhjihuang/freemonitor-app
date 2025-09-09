import { PrismaService } from "../../prisma/prisma.service";
import { BcryptHashingService } from "../hashing/hashing.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from '@nestjs/config';
import { UserResponseDto } from './dto/user.response.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private hashingService;
    private jwtService;
    private configService;
    private logger;
    constructor(prisma: PrismaService, hashingService: BcryptHashingService, jwtService: JwtService, configService: ConfigService);
    validateUser(email: string, password: string): Promise<UserResponseDto | null>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: UserResponseDto;
    }>;
    refresh(token: string): Promise<{
        accessToken: string;
        user: UserResponseDto;
    }>;
}
