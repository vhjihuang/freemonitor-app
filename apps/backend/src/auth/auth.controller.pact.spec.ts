import { PactV4, Matchers, SpecificationVersion } from '@pact-foundation/pact';
import * as path from 'path';

describe('Auth API Contract Tests', () => {
  const pact = new PactV4({
    consumer: 'freemonitor-frontend',
    provider: 'freemonitor-backend',
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: SpecificationVersion.SPECIFICATION_VERSION_V3,
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const expectedResponse = {
        success: true,
        data: {
          user: {
            id: Matchers.string('user-id'),
            email: 'test@example.com',
            name: 'Test User',
            createdAt: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
            updatedAt: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
          },
          tokens: {
            accessToken: Matchers.string('jwt-token'),
            refreshToken: Matchers.string('jwt-token'),
          },
        },
      };

      await pact
        .addInteraction()
        .given('user does not exist')
        .uponReceiving('a request to register a new user')
        .withRequest('POST', '/api/v1/auth/register', (req) => {
          req.headers({
            'Content-Type': 'application/json',
          });
          req.jsonBody({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
          });
        })
        .willRespondWith(201, (res) => {
          res.headers({
            'Content-Type': 'application/json',
            'Set-Cookie': Matchers.like('access_token=jwt-token; HttpOnly; Secure; SameSite=Strict'),
          });
          res.jsonBody(expectedResponse);
        })
        .executeTest(async (mockserver) => {
          // 这里可以添加实际的API调用测试
          // 在实际实现中，您会使用axios或fetch调用mockserver.url
          const response = await fetch(`${mockserver.url}/api/v1/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123',
              name: 'Test User',
            }),
          });
          
          const data = await response.json();
          expect(response.status).toBe(201);
          
          // 验证响应结构
          expect(data).toHaveProperty('success', true);
          expect(data).toHaveProperty('data');
          expect(data.data).toHaveProperty('user');
          expect(data.data).toHaveProperty('tokens');
          
          // 验证用户数据结构
          const user = data.data.user;
          expect(user).toHaveProperty('id');
          expect(user).toHaveProperty('email', 'test@example.com');
          expect(user).toHaveProperty('name', 'Test User');
          expect(user).toHaveProperty('createdAt');
          expect(user).toHaveProperty('updatedAt');
          
          // 验证令牌数据结构
          const tokens = data.data.tokens;
          expect(tokens).toHaveProperty('accessToken');
          expect(tokens).toHaveProperty('refreshToken');
        });
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user successfully', async () => {
      const expectedResponse = {
        success: true,
        data: {
          user: {
            id: Matchers.string('user-id'),
            email: 'test@example.com',
            name: 'Test User',
            createdAt: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
            updatedAt: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
          },
          tokens: {
            accessToken: Matchers.string('jwt-token'),
            refreshToken: Matchers.string('jwt-token'),
          },
        },
      };

      await pact
        .addInteraction()
        .given('user exists with valid credentials')
        .uponReceiving('a request to login')
        .withRequest('POST', '/api/v1/auth/login', (req) => {
          req.headers({
            'Content-Type': 'application/json',
          });
          req.jsonBody({
            email: 'test@example.com',
            password: 'password123',
          });
        })
        .willRespondWith(200, (res) => {
          res.headers({
            'Content-Type': 'application/json',
            'Set-Cookie': Matchers.like('access_token=jwt-token; HttpOnly; Secure; SameSite=Strict'),
          });
          res.jsonBody(expectedResponse);
        })
        .executeTest(async (mockserver) => {
          const response = await fetch(`${mockserver.url}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123',
            }),
          });
          
          const data = await response.json();
          expect(response.status).toBe(200);
          
          // 验证响应结构
          expect(data).toHaveProperty('success', true);
          expect(data).toHaveProperty('data');
          expect(data.data).toHaveProperty('user');
          expect(data.data).toHaveProperty('tokens');
          
          // 验证用户数据结构
          const user = data.data.user;
          expect(user).toHaveProperty('id');
          expect(user).toHaveProperty('email', 'test@example.com');
          expect(user).toHaveProperty('name', 'Test User');
          expect(user).toHaveProperty('createdAt');
          expect(user).toHaveProperty('updatedAt');
          
          // 验证令牌数据结构
          const tokens = data.data.tokens;
          expect(tokens).toHaveProperty('accessToken');
          expect(tokens).toHaveProperty('refreshToken');
        });
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout user successfully', async () => {
      const expectedResponse = {
        success: true,
        message: 'Logout successful',
      };

      await pact
        .addInteraction()
        .given('user is authenticated')
        .uponReceiving('a request to logout')
        .withRequest('POST', '/api/v1/auth/logout', (req) => {
          req.headers({
            'Content-Type': 'application/json',
            'Cookie': Matchers.like('access_token=jwt-token'),
          });
        })
        .willRespondWith(200, (res) => {
          res.headers({
            'Content-Type': 'application/json',
            'Set-Cookie': Matchers.like('access_token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict'),
          });
          res.jsonBody(expectedResponse);
        })
        .executeTest(async (mockserver) => {
          const response = await fetch(`${mockserver.url}/api/v1/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': 'access_token=mock-jwt-token',
            },
          });
          
          const data = await response.json();
          expect(response.status).toBe(200);
          
          // 验证响应结构
          expect(data).toHaveProperty('success', true);
          expect(data).toHaveProperty('message', 'Logout successful');
        });
    });
  });
});