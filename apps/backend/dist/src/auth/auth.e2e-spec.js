"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const testing_1 = require("@nestjs/testing");
const auth_module_1 = require("./auth.module");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const jwt_config_1 = require("../config/jwt.config");
describe("Auth E2E", () => {
    let app;
    let prisma;
    beforeAll(async () => {
        const moduleRef = await testing_1.Test.createTestingModule({
            imports: [
                config_1.ConfigModule.forRoot({
                    load: [jwt_config_1.jwtConfig],
                    isGlobal: true,
                }),
                auth_module_1.AuthModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        prisma = moduleRef.get(prisma_service_1.PrismaService);
        await prisma.user.deleteMany({
            where: { email: "e2e@freemonitor.dev" },
        });
        await app.init();
    });
    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });
    it("/auth/login (POST) should return token", async () => {
        const hashedPassword = "$2b$10$Khhf9Ewob7olff.gGkYzN.XH.I8N3Oi3VtpQFm3osdRBZXs7fjZ7i";
        await prisma.user.create({
            data: {
                email: "e2e@freemonitor.dev",
                name: "E2E User",
                password: hashedPassword,
                isActive: true,
                deletedAt: null,
            },
        });
        return (0, supertest_1.default)(app.getHttpServer())
            .post("/auth/login")
            .send({ email: "e2e@freemonitor.dev", password: "123456" })
            .expect(200)
            .expect((res) => {
            expect(res.body).toHaveProperty("accessToken");
            expect(res.body.accessToken).toBeTruthy();
            expect(res.body.user.email).toBe("e2e@freemonitor.dev");
        });
    });
});
//# sourceMappingURL=auth.e2e-spec.js.map