import { PactV4, Matchers, SpecificationVersion } from '@pact-foundation/pact';
import * as path from 'path';

describe('Dashboard API Contract Tests', () => {
  const pact = new PactV4({
    consumer: 'freemonitor-frontend',
    provider: 'freemonitor-backend',
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: SpecificationVersion.SPECIFICATION_VERSION_V3,
  });

  describe('GET /api/v1/dashboard/overview', () => {
    it('should return dashboard overview data', async () => {
      const expectedResponse = {
        success: true,
        data: {
          totalDevices: Matchers.like(10),
          onlineDevices: Matchers.like(7),
          offlineDevices: Matchers.like(2),
          degradedDevices: Matchers.like(1),
          totalAlerts: Matchers.like(5),
          criticalAlerts: Matchers.like(1),
          warningAlerts: Matchers.like(3),
          infoAlerts: Matchers.like(1),
        },
      };

      await pact
        .addInteraction()
        .given('user has devices and alerts')
        .uponReceiving('a request to get dashboard overview')
        .withRequest('GET', '/api/v1/dashboard/overview', (req) => {
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
          const response = await fetch(`${mockserver.url}/api/v1/dashboard/overview`, {
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
          
          // 验证概览数据结构
          const overview = data.data;
          expect(overview).toHaveProperty('totalDevices');
          expect(overview).toHaveProperty('onlineDevices');
          expect(overview).toHaveProperty('offlineDevices');
          expect(overview).toHaveProperty('degradedDevices');
          expect(overview).toHaveProperty('totalAlerts');
          expect(overview).toHaveProperty('criticalAlerts');
          expect(overview).toHaveProperty('warningAlerts');
          expect(overview).toHaveProperty('infoAlerts');
        });
    });
  });

  describe('GET /api/v1/dashboard/device-status-trend', () => {
    it('should return device status trend data', async () => {
      const expectedResponse = {
        success: true,
        data: {
          trend: Matchers.eachLike({
            timestamp: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
            online: Matchers.like(7),
            offline: Matchers.like(2),
            degraded: Matchers.like(1),
            unknown: Matchers.like(0),
            maintenance: Matchers.like(0),
          }),
          period: '24h',
          interval: '1h',
        },
      };

      await pact
        .addInteraction()
        .given('user has devices with status history')
        .uponReceiving('a request to get device status trend')
        .withRequest('GET', '/api/v1/dashboard/device-status-trend', (req) => {
          req.query({ period: '24h', interval: '1h' });
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
          const response = await fetch(`${mockserver.url}/api/v1/dashboard/device-status-trend?period=24h&interval=1h`, {
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
          
          // 验证趋势数据结构
          const trendData = data.data;
          expect(trendData).toHaveProperty('trend');
          expect(trendData).toHaveProperty('period', '24h');
          expect(trendData).toHaveProperty('interval', '1h');
          
          // 验证趋势数组结构
          expect(Array.isArray(trendData.trend)).toBe(true);
          if (trendData.trend.length > 0) {
            const trendPoint = trendData.trend[0];
            expect(trendPoint).toHaveProperty('timestamp');
            expect(trendPoint).toHaveProperty('online');
            expect(trendPoint).toHaveProperty('offline');
            expect(trendPoint).toHaveProperty('degraded');
            expect(trendPoint).toHaveProperty('unknown');
            expect(trendPoint).toHaveProperty('maintenance');
          }
        });
    });
  });

  describe('GET /api/v1/dashboard/recent-alerts', () => {
    it('should return recent alerts', async () => {
      const expectedResponse = {
        success: true,
        data: {
          items: Matchers.eachLike({
            id: Matchers.string('alert-id'),
            deviceId: Matchers.string('device-id'),
            deviceName: Matchers.string('device-name'),
            type: Matchers.like('warning'),
            message: Matchers.string('Alert message'),
            severity: Matchers.like('warning'),
            resolved: Matchers.boolean(false),
            createdAt: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
            updatedAt: Matchers.datetime('iso8601', '2023-01-01T00:00:00Z'),
          }),
          pagination: {
            hasNext: Matchers.boolean(false),
            hasPrev: Matchers.boolean(false),
            next: Matchers.nullValue(),
            prev: Matchers.nullValue(),
            total: Matchers.like(5),
          },
        },
      };

      await pact
        .addInteraction()
        .given('user has recent alerts')
        .uponReceiving('a request to get recent alerts')
        .withRequest('GET', '/api/v1/dashboard/recent-alerts', (req) => {
          req.query({ limit: '5' });
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
          const response = await fetch(`${mockserver.url}/api/v1/dashboard/recent-alerts?limit=5`, {
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
          
          // 验证告警数据结构
          const alertData = data.data;
          expect(alertData).toHaveProperty('items');
          expect(alertData).toHaveProperty('pagination');
          
          // 验证告警列表结构
          expect(Array.isArray(alertData.items)).toBe(true);
          if (alertData.items.length > 0) {
            const alert = alertData.items[0];
            expect(alert).toHaveProperty('id');
            expect(alert).toHaveProperty('deviceId');
            expect(alert).toHaveProperty('deviceName');
            expect(alert).toHaveProperty('type');
            expect(alert).toHaveProperty('message');
            expect(alert).toHaveProperty('severity');
            expect(alert).toHaveProperty('resolved');
            expect(alert).toHaveProperty('createdAt');
            expect(alert).toHaveProperty('updatedAt');
          }
          
          // 验证分页结构
          expect(alertData.pagination).toHaveProperty('hasNext');
          expect(alertData.pagination).toHaveProperty('hasPrev');
          expect(alertData.pagination).toHaveProperty('next');
          expect(alertData.pagination).toHaveProperty('prev');
          expect(alertData.pagination).toHaveProperty('total');
        });
    });
  });
});