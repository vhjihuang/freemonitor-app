"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
            const messages = errors.map((error) => {
                const constraints = Object.values(error.constraints || {});
                return `${error.property}: ${constraints.join(", ")}`;
            });
            common_1.Logger.warn(`400- Validation Failed: ${messages.join("; ")}`, "Validation");
            return new common_1.BadRequestException(messages);
        },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(",") || ["https://freemonitor-app-frontend.vercel.app", "http://localhost:3000", "http://localhost:3001"],
    });
    const port = process.env.PORT || 3001;
    await app.listen(port);
    common_1.Logger.log(`🚀 Backend server running on http://localhost:${port}`, "Bootstrap");
}
bootstrap();
//# sourceMappingURL=main.js.map