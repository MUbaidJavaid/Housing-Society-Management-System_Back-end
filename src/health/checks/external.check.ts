import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { HealthCheckResult, HealthStatus, Severity } from '../types';
import { BaseHealthCheck } from './base.check';

export interface ExternalServiceConfig {
  name: string;
  url: string;
  method?: 'GET' | 'POST' | 'HEAD';
  headers?: Record<string, string>;
  timeout?: number;
  expectedStatus?: number;
  expectedBody?: any;
  validateResponse?: (response: AxiosResponse) => boolean;
}

export class ExternalServiceHealthCheck extends BaseHealthCheck {
  private serviceConfig: ExternalServiceConfig;
  private axiosInstance: AxiosInstance;

  constructor(config: ExternalServiceConfig) {
    super(
      `${config.name.toLowerCase()}-service`,
      config.name,
      'external',
      config.name.toLowerCase().includes('critical') ? Severity.CRITICAL : Severity.MEDIUM,
      config.timeout || 10000
    );

    this.serviceConfig = config;

    this.axiosInstance = axios.create({
      baseURL: config.url,
      timeout: config.timeout || 10000,
      headers: config.headers,
      validateStatus: () => true, // Don't throw on non-2xx
    });
  }

  async check(): Promise<HealthCheckResult> {
    return this.executeCheck(async () => {
      const startTime = Date.now();

      const response = await this.axiosInstance.request({
        method: this.serviceConfig.method || 'GET',
        url: '',
      });

      const duration = Date.now() - startTime;
      const expectedStatus = this.serviceConfig.expectedStatus || 200;

      // Validate response
      let isValid = response.status === expectedStatus;
      let validationMessage = '';

      if (this.serviceConfig.validateResponse) {
        isValid = this.serviceConfig.validateResponse(response);
        if (!isValid) {
          validationMessage = 'Custom validation failed';
        }
      } else if (this.serviceConfig.expectedBody) {
        isValid = JSON.stringify(response.data) === JSON.stringify(this.serviceConfig.expectedBody);
        if (!isValid) {
          validationMessage = 'Response body mismatch';
        }
      }

      const status = isValid ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
      const message = isValid
        ? `${this.serviceConfig.name} is responding correctly`
        : `${this.serviceConfig.name} check failed: ${validationMessage || `Expected status ${expectedStatus}, got ${response.status}`}`;

      return {
        name: this.name,
        status,
        severity: this.severity,
        message,
        timestamp: new Date(),
        duration,
        component: this.component,
        componentType: this.componentType,
        metadata: {
          url: this.serviceConfig.url,
          method: this.serviceConfig.method || 'GET',
          statusCode: response.status,
          responseTime: duration,
          contentType: response.headers['content-type'],
          contentLength: response.headers['content-length'],
          latency: duration,
          ...(response.data && typeof response.data === 'object'
            ? { responseData: response.data }
            : { responseBody: response.data }),
        },
        ...(!isValid ? { error: validationMessage || `Status ${response.status}` } : {}),
      };
    });
  }

  /**
   * Check service latency
   */
  async checkLatency(): Promise<HealthCheckResult> {
    return this.executeCheck(async () => {
      const latencies: number[] = [];
      const iterations = 3; // Run 3 times for average

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        try {
          await this.axiosInstance.head('');
          latencies.push(Date.now() - startTime);
        } catch (error) {
          latencies.push(this.timeout); // Use timeout as failed latency
        }

        // Small delay between iterations
        if (i < iterations - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);

      const status =
        avgLatency < 100
          ? HealthStatus.HEALTHY
          : avgLatency < 500
            ? HealthStatus.DEGRADED
            : HealthStatus.UNHEALTHY;

      return {
        name: `${this.name}-latency`,
        status,
        severity: Severity.MEDIUM,
        message:
          avgLatency < 100
            ? 'Service latency is excellent'
            : avgLatency < 500
              ? 'Service latency is acceptable'
              : 'Service latency is poor',
        timestamp: new Date(),
        duration: avgLatency,
        component: this.component,
        componentType: this.componentType,
        metadata: {
          averageLatency: avgLatency.toFixed(2),
          minLatency,
          maxLatency,
          iterations,
          latencies,
          threshold: 100,
        },
      };
    });
  }
}

/**
 * Common external service checks
 */
export class CommonExternalChecks {
  static createEmailServiceCheck(emailServiceUrl?: string): ExternalServiceHealthCheck {
    return new ExternalServiceHealthCheck({
      name: 'Email Service',
      url: emailServiceUrl || process.env.EMAIL_SERVICE_URL || 'http://localhost:8025',
      method: 'GET',
      expectedStatus: 200,
      timeout: 5000,
    });
  }

  static createStorageServiceCheck(storageServiceUrl?: string): ExternalServiceHealthCheck {
    return new ExternalServiceHealthCheck({
      name: 'Storage Service',
      url:
        storageServiceUrl ||
        process.env.STORAGE_SERVICE_URL ||
        'http://localhost:9000/minio/health/live',
      method: 'GET',
      expectedStatus: 200,
      timeout: 10000,
    });
  }

  static createPaymentGatewayCheck(paymentGatewayUrl?: string): ExternalServiceHealthCheck {
    return new ExternalServiceHealthCheck({
      name: 'Payment Gateway',
      url: paymentGatewayUrl || process.env.PAYMENT_GATEWAY_URL || 'https://api.stripe.com/v1',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY || 'dummy'}`,
      },
      expectedStatus: 200,
      timeout: 15000,
    });
  }

  static createThirdPartyAPICheck(
    name: string,
    url: string,
    apiKey?: string
  ): ExternalServiceHealthCheck {
    return new ExternalServiceHealthCheck({
      name,
      url,
      method: 'GET',
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      expectedStatus: 200,
      timeout: 10000,
    });
  }
}
