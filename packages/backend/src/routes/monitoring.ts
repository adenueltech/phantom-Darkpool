/**
 * Monitoring API Routes
 * 
 * Provides endpoints for monitoring and alerting:
 * - GET /monitoring/stats - Get monitoring statistics
 * - GET /monitoring/alerts - Get recent alerts
 * - GET /monitoring/metrics/:type - Get metrics by type
 * - POST /monitoring/thresholds - Update alert thresholds
 * 
 * Requirements: 20.4
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import {
  monitoringService,
  MetricType,
  AlertSeverity,
} from '../services/monitoringService';

const router: RouterType = Router();

/**
 * GET /monitoring/stats
 * Get monitoring statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = monitoringService.getStats();
    
    res.json({
      success: true,
      stats,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error getting monitoring stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get monitoring stats',
    });
  }
});

/**
 * GET /monitoring/alerts
 * Get recent alerts
 */
router.get('/alerts', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const severity = req.query.severity as AlertSeverity;

    const alerts = severity
      ? monitoringService.getAlertsBySeverity(severity)
      : monitoringService.getRecentAlerts(limit);

    res.json({
      success: true,
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts',
    });
  }
});

/**
 * GET /monitoring/metrics/:type
 * Get metrics by type
 */
router.get('/metrics/:type', (req: Request, res: Response) => {
  try {
    const type = req.params.type as MetricType;
    const limit = parseInt(req.query.limit as string) || 100;
    const startTime = parseInt(req.query.startTime as string);
    const endTime = parseInt(req.query.endTime as string);

    let metrics;
    if (startTime && endTime) {
      metrics = monitoringService.getMetricsInRange(type, startTime, endTime);
    } else {
      metrics = monitoringService.getMetrics(type, limit);
    }

    res.json({
      success: true,
      type,
      metrics,
      count: metrics.length,
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
    });
  }
});

/**
 * GET /monitoring/thresholds
 * Get current alert thresholds
 */
router.get('/thresholds', (req: Request, res: Response) => {
  try {
    const thresholds = monitoringService.getThresholds();
    
    res.json({
      success: true,
      thresholds,
    });
  } catch (error) {
    console.error('Error getting thresholds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get thresholds',
    });
  }
});

/**
 * POST /monitoring/thresholds
 * Update alert thresholds
 */
router.post('/thresholds', (req: Request, res: Response) => {
  try {
    const thresholds = req.body;
    
    monitoringService.setThresholds(thresholds);
    
    res.json({
      success: true,
      message: 'Thresholds updated',
      thresholds: monitoringService.getThresholds(),
    });
  } catch (error) {
    console.error('Error updating thresholds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update thresholds',
    });
  }
});

/**
 * GET /monitoring/export
 * Export all metrics and alerts
 */
router.get('/export', (req: Request, res: Response) => {
  try {
    const data = monitoringService.exportMetrics();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=monitoring-export.json');
    res.send(data);
  } catch (error) {
    console.error('Error exporting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export metrics',
    });
  }
});

/**
 * GET /monitoring/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const stats = monitoringService.getStats();
    
    const health = {
      status: 'healthy',
      transactionSuccessRate: stats.transactionSuccessRate,
      proofVerificationSuccessRate: stats.proofVerificationSuccessRate,
      doubleSpendAttempts: stats.doubleSpendAttempts,
      timestamp: Date.now(),
    };

    // Determine health status
    if (stats.doubleSpendAttempts > 0) {
      health.status = 'critical';
    } else if (
      stats.transactionSuccessRate < 0.95 ||
      stats.proofVerificationSuccessRate < 0.98
    ) {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to check health',
    });
  }
});

export default router;
