import { PactV4, Matchers, SpecificationVersion } from '@pact-foundation/pact';
import * as path from 'path';

describe('Device API Contract Tests', () => {
  const pact = new PactV4({
    consumer: 'freemonitor-frontend',
    provider: 'freemonitor-backend',
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: SpecificationVersion.SPECIFICATION_VERSION_V3,
  });

  describe('GET /api/v1/devices', () => {
    it('should return a paginated list of devices', async () => {
      const expectedResponse = {
        success: true,
        data: {
          items: Matchers.eachLike({
            id: Matchers.string('device-id'),
            name: Matchers.string('device-name'),
            hostname: Matchers.string('hostname'),
            ipAddress: Matchers.string('192.168.1.1'),
            status: Matchers.like('online'),
            lastSeen: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
            createdAt: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
            updatedAt: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
          }),
          pagination: {
            hasNext: Matchers.boolean(false),
            hasPrev: Matchers.boolean(false),
            next: Matchers.nullValue(),
            prev: Matchers.nullValue(),
            total: Matchers.like(10),
          },
        },
      };

      await pact
        .addInteraction()
        .given('user has devices')
        .uponReceiving('a request to get devices list')
        .withRequest('GET', '/api/v1/devices', (req) => {
          req.query({ limit: '10' });
          req.headers({
            'Content-Type': 'application/json',
            'Cookie': Matchers.like('access_token=jwt-token'),
          });
        })
        .willRespondWith(200, (res) => {
          res.headers({
            'Content-Type': 'application/json',
          });
          res.jsonBody(expectedResponse);
        })
        .executeTest(async (mockserver) => {
          const response = await fetch(`${mockserver.url}/api/v1/devices?limit=10`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': 'access_token=mock-jwt-token',
            },
          });
          
          const data = await response.json();
          expect(response.status).toBe(200);
          
          // 验证响应结构
          expect(data).toHaveProperty('success', true);
          expect(data).toHaveProperty('data');
          expect(data.data).toHaveProperty('items');
          expect(data.data).toHaveProperty('pagination');
          
          // 验证设备列表结构
          expect(Array.isArray(data.data.items)).toBe(true);
          if (data.data.items.length > 0) {
            const device = data.data.items[0];
            expect(device).toHaveProperty('id');
            expect(device).toHaveProperty('name');
            expect(device).toHaveProperty('hostname');
            expect(device).toHaveProperty('ipAddress');
            expect(device).toHaveProperty('status');
            expect(device).toHaveProperty('lastSeen');
            expect(device).toHaveProperty('createdAt');
            expect(device).toHaveProperty('updatedAt');
          }
          
          // 验证分页结构
          expect(data.data.pagination).toHaveProperty('hasNext');
          expect(data.data.pagination).toHaveProperty('hasPrev');
          expect(data.data.pagination).toHaveProperty('next');
          expect(data.data.pagination).toHaveProperty('prev');
          expect(data.data.pagination).toHaveProperty('total');
        });
    });
  });

  describe('POST /api/v1/devices', () => {
    it('should create a new device', async () => {
      const requestBody = {
        name: 'Test Device',
        hostname: 'test-hostname',
        ipAddress: '192.168.1.100',
        description: 'Test device description',
      };

      const expectedResponse = {
        success: true,
        data: {
          id: Matchers.string('device-id'),
          name: requestBody.name,
          hostname: requestBody.hostname,
          ipAddress: requestBody.ipAddress,
          description: requestBody.description,
          status: 'unknown',
          lastSeen: Matchers.nullValue(),
          createdAt: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
          updatedAt: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
        },
      };

      await pact
        .addInteraction()
        .given('user is authenticated')
        .uponReceiving('a request to create a new device')
        .withRequest('POST', '/api/v1/devices', (req) => {
          req.headers({
            'Content-Type': 'application/json',
            'Cookie': Matchers.like('access_token=jwt-token'),
          });
          req.jsonBody(requestBody);
        })
        .willRespondWith(201, (res) => {
          res.headers({
            'Content-Type': 'application/json',
          });
          res.jsonBody(expectedResponse);
        })
        .executeTest(async (mockserver) => {
          const response = await fetch(`${mockserver.url}/api/v1/devices`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': 'access_token=mock-jwt-token',
            },
            body: JSON.stringify(requestBody),
          });
          
          const data = await response.json();
          expect(response.status).toBe(201);
          
          // 验证响应结构
          expect(data).toHaveProperty('success', true);
          expect(data).toHaveProperty('data');
          
          // 验证设备数据结构
          const device = data.data;
          expect(device).toHaveProperty('id');
          expect(device).toHaveProperty('name', requestBody.name);
          expect(device).toHaveProperty('hostname', requestBody.hostname);
          expect(device).toHaveProperty('ipAddress', requestBody.ipAddress);
          expect(device).toHaveProperty('description', requestBody.description);
          expect(device).toHaveProperty('status', 'unknown');
          expect(device).toHaveProperty('lastSeen', null);
          expect(device).toHaveProperty('createdAt');
          expect(device).toHaveProperty('updatedAt');
        });
    });
  });

  describe('GET /api/v1/devices/:id', () => {
    it('should return a specific device', async () => {
      const expectedResponse = {
        success: true,
        data: {
          id: Matchers.string('device-id'),
          name: Matchers.string('device-name'),
          hostname: Matchers.string('hostname'),
          ipAddress: Matchers.string('192.168.1.1'),
          description: Matchers.string('device description'),
          status: Matchers.like('online'),
          lastSeen: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
          createdAt: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
          updatedAt: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
        },
      };

      await pact
        .addInteraction()
        .given('device exists and belongs to user')
        .uponReceiving('a request to get a specific device')
        .withRequest('GET', '/api/v1/devices/device-id-123', (req) => {
          req.headers({
            'Content-Type': 'application/json',
            'Cookie': Matchers.like('access_token=jwt-token'),
          });
        })
        .willRespondWith(200, (res) => {
          res.headers({
            'Content-Type': 'application/json',
          });
          res.jsonBody(expectedResponse);
        })
        .executeTest(async (mockserver) => {
          const response = await fetch(`${mockserver.url}/api/v1/devices/device-id-123`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': 'access_token=mock-jwt-token',
            },
          });
          
          const data = await response.json();
          expect(response.status).toBe(200);
          
          // 验证响应结构
          expect(data).toHaveProperty('success', true);
          expect(data).toHaveProperty('data');
          
          // 验证设备数据结构
          const device = data.data;
          expect(device).toHaveProperty('id');
          expect(device).toHaveProperty('name');
          expect(device).toHaveProperty('hostname');
          expect(device).toHaveProperty('ipAddress');
          expect(device).toHaveProperty('description');
          expect(device).toHaveProperty('status');
          expect(device).toHaveProperty('lastSeen');
          expect(device).toHaveProperty('createdAt');
          expect(device).toHaveProperty('updatedAt');
        });
    });
  });

  describe('PUT /api/v1/devices/:id', () => {
    it('should update a device', async () => {
      const requestBody = {
        name: 'Updated Device Name',
        description: 'Updated device description',
      };

      const expectedResponse = {
        success: true,
        data: {
          id: Matchers.string('device-id'),
          name: requestBody.name,
          hostname: Matchers.string('hostname'),
          ipAddress: Matchers.string('192.168.1.1'),
          description: requestBody.description,
          status: Matchers.like('online'),
          lastSeen: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
          createdAt: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
          updatedAt: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
        },
      };

      await pact
        .addInteraction()
        .given('device exists and belongs to user')
        .uponReceiving('a request to update a device')
        .withRequest('PUT', '/api/v1/devices/device-id-123', (req) => {
          req.headers({
            'Content-Type': 'application/json',
            'Cookie': Matchers.like('access_token=jwt-token'),
          });
          req.jsonBody(requestBody);
        })
        .willRespondWith(200, (res) => {
          res.headers({
            'Content-Type': 'application/json',
          });
          res.jsonBody(expectedResponse);
        })
        .executeTest(async (mockserver) => {
          const response = await fetch(`${mockserver.url}/api/v1/devices/device-id-123`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': 'access_token=mock-jwt-token',
            },
            body: JSON.stringify(requestBody),
          });
          
          const data = await response.json();
          expect(response.status).toBe(200);
          
          // 验证响应结构
          expect(data).toHaveProperty('success', true);
          expect(data).toHaveProperty('data');
          
          // 验证设备数据结构
          const device = data.data;
          expect(device).toHaveProperty('id');
          expect(device).toHaveProperty('name', requestBody.name);
          expect(device).toHaveProperty('hostname');
          expect(device).toHaveProperty('ipAddress');
          expect(device).toHaveProperty('description', requestBody.description);
          expect(device).toHaveProperty('status');
          expect(device).toHaveProperty('lastSeen');
          expect(device).toHaveProperty('createdAt');
          expect(device).toHaveProperty('updatedAt');
        });
    });
  });

  describe('DELETE /api/v1/devices/:id', () => {
    it('should delete a device', async () => {
      const expectedResponse = {
        success: true,
        message: 'Device deleted successfully',
      };

      await pact
        .addInteraction()
        .given('device exists and belongs to user')
        .uponReceiving('a request to delete a device')
        .withRequest('DELETE', '/api/v1/devices/device-id-123', (req) => {
          req.headers({
            'Content-Type': 'application/json',
            'Cookie': Matchers.like('access_token=jwt-token'),
          });
        })
        .willRespondWith(200, (res) => {
          res.headers({
            'Content-Type': 'application/json',
          });
          res.jsonBody(expectedResponse);
        })
        .executeTest(async (mockserver) => {
          const response = await fetch(`${mockserver.url}/api/v1/devices/device-id-123`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': 'access_token=mock-jwt-token',
            },
          });
          
          const data = await response.json();
          expect(response.status).toBe(200);
          
          // 验证响应结构
          expect(data).toHaveProperty('success', true);
          expect(data).toHaveProperty('message', 'Device deleted successfully');
        });
    });
  });
});