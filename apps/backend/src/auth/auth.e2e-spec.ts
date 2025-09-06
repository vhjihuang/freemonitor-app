// src/auth/auth.e2e-spec.ts
import request from "supertest";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AuthModule } from "./auth.module";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigModule } from "@nestjs/config";
import jwtConfig from "../config/jwt.config"; // 确保路径正确

describe("Auth E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [jwtConfig], // ✅ 加载你的 JWT 配置
          isGlobal: true, // 可选：让 ConfigService 全局可用
        }),
        AuthModule, // ✅ 现在它可以正确读取 ConfigService
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);

    // 清理测试数据（可选）
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
    const hashedPassword = "$2b$10$Khhf9Ewob7olff.gGkYzN.XH.I8N3Oi3VtpQFm3osdRBZXs7fjZ7i"; // '123456' 的哈希

    await prisma.user.create({
      data: {
        email: "e2e@freemonitor.dev",
        name: "E2E User",
        password: hashedPassword,
        isActive: true,
        deletedAt: null,
      },
    });

    return request(app.getHttpServer())
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
