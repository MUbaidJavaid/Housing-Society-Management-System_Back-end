import { HealthCheckResult, HealthStatus, Severity } from '../types';

export abstract class BaseHealthCheck {
  protected name: string;
  protected component: string;
  protected componentType: 'internal' | 'external' | 'infrastructure';
  protected severity: Severity;
  protected timeout: number;

  constructor(
    name: string,
    component: string,
    componentType: 'internal' | 'external' | 'infrastructure' = 'external',
    severity: Severity = Severity.MEDIUM,
    timeout: number = 5000
  ) {
    this.name = name;
    this.component = component;
    this.componentType = componentType;
    this.severity = severity;
    this.timeout = timeout;
  }

  /**
   * Execute the health check with timeout
   */
  protected async executeCheck(checkFn: () => Promise<any>): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        checkFn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), this.timeout)
        ),
      ]);

      const duration = Date.now() - startTime;

      return {
        name: this.name,
        status: HealthStatus.HEALTHY,
        severity: this.severity,
        message: `${this.component} is healthy`,
        timestamp: new Date(),
        duration,
        component: this.component,
        componentType: this.componentType,
        metadata: result,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      return {
        name: this.name,
        status: HealthStatus.UNHEALTHY,
        severity: this.severity,
        message: `${this.component} check failed`,
        timestamp: new Date(),
        duration,
        component: this.component,
        componentType: this.componentType,
        error: error.message || 'Unknown error',
        metadata: { timeout: this.timeout },
      };
    }
  }

  /**
   * Abstract method to be implemented by subclasses
   */
  abstract check(): Promise<HealthCheckResult>;
}
