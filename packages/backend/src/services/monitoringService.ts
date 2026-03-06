/**
 * Monitoring and Alerting Service
 * 
 * Implements comprehensive monitoring:
 * - Transaction success rate monitoring
 * - Proof verification failure alerts
 * - Double-spend attempt detection
 * - Gas cost metrics tracking
 * 
 * Requirements: 20.4
 */

import { EventEmitter } from 'events';

/**
 * Metric types
 */
export enum MetricType {
  TRANSACTION_SUCCESS = 'transaction_success',
  TRANSACTION_FAILURE = 'transaction_failure',
  PROOF_VERIFICATION_SUCCESS = 'proof_verification_success',
  PROOF_VERIFICATION_FAILURE = 'proof_verification_failure',
  DOUBLE_SPEND_ATTEMPT = 'double_spend_attempt',
  GAS_COST = 'gas_cost',
  ORDER_SUBMISSION = 'order_submission',
  SETTLEMENT_SUCCESS = 'settlement_success',
  SETTLEMENT_FAILURE = 'settlement_failure',
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Metric data
 */
export interface Metric {
  type: MetricType;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Alert data
 */
export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Monitoring statistics
 */
export interface MonitoringStats {
  transactionSuccessRate: number;
  proofVerificationSuccessRate: number;
  doubleSpendAttempts: number;
  averageGasCost: number;
  totalTransactions: number;
  totalProofVerifications: number;
  alertCount: number;
}

/**
 * Monitoring Service
 * Tracks metrics and generates alerts
 */
export class MonitoringService extends EventEmitter {
  private metrics: Map<MetricType, Metric[]> = new Map();
  private alerts: Alert[] = [];
  private alertHandlers: Map<AlertSeverity, ((alert: Alert) => void)[]> = new Map();
  
  // Thresholds for alerts
  private thresholds = {
    transactionSuccessRate: 0.95, // Alert if below 95%
    proofVerificationSuccessRate: 0.98, // Alert if below 98%
    maxGasCost: 1000000, // Alert if gas cost exceeds 1M
    doubleSpendAttempts: 1, // Alert on any double-spend attempt
  };

  constructor() {
    super();
    this.initializeMetricTypes();
  }

  /**
   * Initialize metric storage for all types
   */
  private initializeMetricTypes(): void {
    for (const type of Object.values(MetricType)) {
      this.metrics.set(type as MetricType, []);
    }
  }

  /**
   * Record a metric
   */
  recordMetric(type: MetricType, value: number, metadata?: Record<string, any>): void {
    const metric: Metric = {
      type,
      value,
      timestamp: Date.now(),
      metadata,
    };

    const metrics = this.metrics.get(type) || [];
    metrics.push(metric);
    this.metrics.set(type, metrics);

    // Check for alert conditions
    this.checkAlertConditions(type, metric);

    // Emit metric event
    this.emit('metric', metric);
  }

  /**
   * Check if metric triggers any alerts
   */
  private checkAlertConditions(type: MetricType, metric: Metric): void {
    switch (type) {
      case MetricType.DOUBLE_SPEND_ATTEMPT:
        this.createAlert(
          AlertSeverity.CRITICAL,
          'Double-spend attempt detected',
          metric.metadata
        );
        break;

      case MetricType.PROOF_VERIFICATION_FAILURE:
        const verificationRate = this.getProofVerificationSuccessRate();
        if (verificationRate < this.thresholds.proofVerificationSuccessRate) {
          this.createAlert(
            AlertSeverity.ERROR,
            `Proof verification success rate dropped to ${(verificationRate * 100).toFixed(2)}%`,
            { rate: verificationRate }
          );
        }
        break;

      case MetricType.TRANSACTION_FAILURE:
        const successRate = this.getTransactionSuccessRate();
        if (successRate < this.thresholds.transactionSuccessRate) {
          this.createAlert(
            AlertSeverity.WARNING,
            `Transaction success rate dropped to ${(successRate * 100).toFixed(2)}%`,
            { rate: successRate }
          );
        }
        break;

      case MetricType.GAS_COST:
        if (metric.value > this.thresholds.maxGasCost) {
          this.createAlert(
            AlertSeverity.WARNING,
            `High gas cost detected: ${metric.value}`,
            { gasCost: metric.value }
          );
        }
        break;
    }
  }

  /**
   * Create an alert
   */
  private createAlert(
    severity: AlertSeverity,
    message: string,
    metadata?: Record<string, any>
  ): void {
    const alert: Alert = {
      id: this.generateAlertId(),
      severity,
      message,
      timestamp: Date.now(),
      metadata,
    };

    this.alerts.push(alert);

    // Emit alert event
    this.emit('alert', alert);

    // Call registered handlers
    const handlers = this.alertHandlers.get(severity) || [];
    for (const handler of handlers) {
      try {
        handler(alert);
      } catch (error) {
        console.error('Alert handler error:', error);
      }
    }

    console.log(`[${severity.toUpperCase()}] ${message}`, metadata || '');
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Register alert handler
   */
  onAlert(severity: AlertSeverity, handler: (alert: Alert) => void): void {
    const handlers = this.alertHandlers.get(severity) || [];
    handlers.push(handler);
    this.alertHandlers.set(severity, handlers);
  }

  /**
   * Get transaction success rate
   */
  getTransactionSuccessRate(): number {
    const successes = this.metrics.get(MetricType.TRANSACTION_SUCCESS) || [];
    const failures = this.metrics.get(MetricType.TRANSACTION_FAILURE) || [];
    
    const total = successes.length + failures.length;
    if (total === 0) return 1.0;
    
    return successes.length / total;
  }

  /**
   * Get proof verification success rate
   */
  getProofVerificationSuccessRate(): number {
    const successes = this.metrics.get(MetricType.PROOF_VERIFICATION_SUCCESS) || [];
    const failures = this.metrics.get(MetricType.PROOF_VERIFICATION_FAILURE) || [];
    
    const total = successes.length + failures.length;
    if (total === 0) return 1.0;
    
    return successes.length / total;
  }

  /**
   * Get double-spend attempt count
   */
  getDoubleSpendAttempts(): number {
    const attempts = this.metrics.get(MetricType.DOUBLE_SPEND_ATTEMPT) || [];
    return attempts.length;
  }

  /**
   * Get average gas cost
   */
  getAverageGasCost(): number {
    const gasCosts = this.metrics.get(MetricType.GAS_COST) || [];
    
    if (gasCosts.length === 0) return 0;
    
    const total = gasCosts.reduce((sum, metric) => sum + metric.value, 0);
    return total / gasCosts.length;
  }

  /**
   * Get monitoring statistics
   */
  getStats(): MonitoringStats {
    return {
      transactionSuccessRate: this.getTransactionSuccessRate(),
      proofVerificationSuccessRate: this.getProofVerificationSuccessRate(),
      doubleSpendAttempts: this.getDoubleSpendAttempts(),
      averageGasCost: this.getAverageGasCost(),
      totalTransactions: this.getTotalTransactions(),
      totalProofVerifications: this.getTotalProofVerifications(),
      alertCount: this.alerts.length,
    };
  }

  /**
   * Get total transactions
   */
  private getTotalTransactions(): number {
    const successes = this.metrics.get(MetricType.TRANSACTION_SUCCESS) || [];
    const failures = this.metrics.get(MetricType.TRANSACTION_FAILURE) || [];
    return successes.length + failures.length;
  }

  /**
   * Get total proof verifications
   */
  private getTotalProofVerifications(): number {
    const successes = this.metrics.get(MetricType.PROOF_VERIFICATION_SUCCESS) || [];
    const failures = this.metrics.get(MetricType.PROOF_VERIFICATION_FAILURE) || [];
    return successes.length + failures.length;
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(count: number = 10): Alert[] {
    return this.alerts.slice(-count);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Get metrics by type
   */
  getMetrics(type: MetricType, limit?: number): Metric[] {
    const metrics = this.metrics.get(type) || [];
    return limit ? metrics.slice(-limit) : metrics;
  }

  /**
   * Get metrics in time range
   */
  getMetricsInRange(
    type: MetricType,
    startTime: number,
    endTime: number
  ): Metric[] {
    const metrics = this.metrics.get(type) || [];
    return metrics.filter(
      metric => metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Clear old metrics (keep last N)
   */
  clearOldMetrics(keepCount: number = 1000): void {
    for (const [type, metrics] of this.metrics.entries()) {
      if (metrics.length > keepCount) {
        const newMetrics = metrics.slice(-keepCount);
        this.metrics.set(type, newMetrics);
      }
    }
  }

  /**
   * Clear old alerts (keep last N)
   */
  clearOldAlerts(keepCount: number = 100): void {
    if (this.alerts.length > keepCount) {
      this.alerts = this.alerts.slice(-keepCount);
    }
  }

  /**
   * Set alert thresholds
   */
  setThresholds(thresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): typeof this.thresholds {
    return { ...this.thresholds };
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    const data = {
      metrics: Array.from(this.metrics.entries()).map(([type, metrics]) => ({
        type,
        metrics,
      })),
      alerts: this.alerts,
      stats: this.getStats(),
      timestamp: Date.now(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Reset all metrics and alerts
   */
  reset(): void {
    this.metrics.clear();
    this.alerts = [];
    this.initializeMetricTypes();
  }
}

/**
 * Global monitoring service instance
 */
export const monitoringService = new MonitoringService();

// Set up default alert handlers
monitoringService.onAlert(AlertSeverity.CRITICAL, (alert) => {
  console.error('🚨 CRITICAL ALERT:', alert.message, alert.metadata);
  // In production: send to alerting system (PagerDuty, Slack, etc.)
});

monitoringService.onAlert(AlertSeverity.ERROR, (alert) => {
  console.error('❌ ERROR ALERT:', alert.message, alert.metadata);
  // In production: send to logging system
});

monitoringService.onAlert(AlertSeverity.WARNING, (alert) => {
  console.warn('⚠️  WARNING ALERT:', alert.message, alert.metadata);
});

monitoringService.onAlert(AlertSeverity.INFO, (alert) => {
  console.info('ℹ️  INFO ALERT:', alert.message, alert.metadata);
});
