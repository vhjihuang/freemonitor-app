import { PactV4, SpecificationVersion } from '@pact-foundation/pact';
import * as path from 'path';

// 全局Pact配置
global.pact = new PactV4({
  consumer: 'freemonitor-frontend',
  provider: 'freemonitor-backend',
  port: 1234,
  dir: path.resolve(process.cwd(), 'pacts'),
  spec: SpecificationVersion.SPECIFICATION_VERSION_V3,
});

// 测试前设置
beforeAll(async () => {
  // PactV4不需要显式setup
});

// 测试后清理
afterAll(async () => {
  // PactV4不需要显式finalize，会自动清理
});

// 每个测试后重置模拟
afterEach(async () => {
  // PactV4不需要显式verify和removeInteractions
});