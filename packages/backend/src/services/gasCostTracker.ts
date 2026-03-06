/**
 * Gas Cost Tracker
 * 
 * Tracks and analyzes gas costs for different operations:
 * - Settlement gas costs
 * - Proof verification gas costs
 * - Batch operation savings
 * - Historical gas cost trends
 * 
 * Requirements: 20.4
 */

import { monitoringService, MetricType } from './monitoringService';

/**
 * Gas cost entry
 */
export interface GasCostEntry {
  operation: string;
  gasCost: number;
  timestamp: number;
  transactionHash?: string;
  metadata?: Record<string, any>;
}

/**
 * Gas cost statistics
 */
export interface GasCostStats {
  operation: string;
  count: number;
  totalGas: number;
  averageGas: number;
  minGas: number;
  maxGas: number;
  medianGas: number;
}

/**
 * Gas Cost Tracker
 * Monitors and analyzes gas costs
 */
export class GasCostTracker {
  private gasCosts: Map<string, GasCostEntry[]> = new Map();

  /**
   * Record gas cost for an operation
   */
  recordGasCost(
    operation: string,
    gasCost: number,
    transactionHash?: string,
    metadata?: Record<string, any>
  ): void {
    const entry: GasCostEntry = {
      operation,
      gasCost,
      timestamp: Date.now(),
      transactionHash,
      metadata,
    };

    const entries = this.gasCosts.get(operation) || [];
    entries.push(entry);
    this.gasCosts.set(operation, entries);

    // Record in monitoring service
    monitoringService.recordMetric(MetricType.GAS_COST, gasCost, {
      operation,
      transactionHash,
      ...metadata,
    });

    console.log(`⛽ Gas cost for ${operation}: ${gasCost}`);
  }

  /**
   * Get gas cost statistics for an operation
   */
  getStats(operation: string): GasCostStats | null {
    const entries = this.gasCosts.get(operation);
    if (!entries || entries.length === 0) {
      return null;
    }

    const costs = entries.map(e => e.gasCost).sort((a, b) => a - b);
    const totalGas = costs.reduce((sum, cost) => sum + cost, 0);
    const averageGas = totalGas / costs.length;
    const minGas = costs[0];
    const maxGas = costs[costs.length - 1];
    const medianGas = costs[Math.floor(costs.length / 2)];

    return {
      operation,
      count: entries.length,
      totalGas,
      averageGas,
      minGas,
      maxGas,
      medianGas,
    };
  }

  /**
   * Get all gas cost statistics
   */
  getAllStats(): GasCostStats[] {
    const stats: GasCostStats[] = [];

    for (const operation of this.gasCosts.keys()) {
      const operationStats = this.getStats(operation);
      if (operationStats) {
        stats.push(operationStats);
      }
    }

    return stats.sort((a, b) => b.averageGas - a.averageGas);
  }

  /**
   * Compare gas costs between operations
   */
  compareOperations(operation1: string, operation2: string): {
    operation1: GasCostStats | null;
    operation2: GasCostStats | null;
    difference: number;
    percentDifference: number;
  } {
    const stats1 = this.getStats(operation1);
    const stats2 = this.getStats(operation2);

    const difference = stats1 && stats2 ? stats1.averageGas - stats2.averageGas : 0;
    const percentDifference =
      stats1 && stats2 && stats2.averageGas > 0
        ? (difference / stats2.averageGas) * 100
        : 0;

    return {
      operation1: stats1,
      operation2: stats2,
      difference,
      percentDifference,
    };
  }

  /**
   * Calculate batch operation savings
   */
  calculateBatchSavings(
    singleOperationCost: number,
    batchOperationCost: number,
    batchSize: number
  ): {
    individualTotal: number;
    batchTotal: number;
    savings: number;
    savingsPercent: number;
  } {
    const individualTotal = singleOperationCost * batchSize;
    const batchTotal = batchOperationCost;
    const savings = individualTotal - batchTotal;
    const savingsPercent = (savings / individualTotal) * 100;

    return {
      individualTotal,
      batchTotal,
      savings,
      savingsPercent,
    };
  }

  /**
   * Get gas cost trend over time
   */
  getTrend(operation: string, timeWindow: number = 3600000): {
    operation: string;
    timeWindow: number;
    entries: GasCostEntry[];
    averageGas: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    const entries = this.gasCosts.get(operation) || [];
    const now = Date.now();
    const recentEntries = entries.filter(e => now - e.timestamp <= timeWindow);

    if (recentEntries.length === 0) {
      return {
        operation,
        timeWindow,
        entries: [],
        averageGas: 0,
        trend: 'stable',
      };
    }

    const averageGas =
      recentEntries.reduce((sum, e) => sum + e.gasCost, 0) / recentEntries.length;

    // Calculate trend (simple linear regression)
    const trend = this.calculateTrend(recentEntries);

    return {
      operation,
      timeWindow,
      entries: recentEntries,
      averageGas,
      trend,
    };
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(entries: GasCostEntry[]): 'increasing' | 'decreasing' | 'stable' {
    if (entries.length < 2) {
      return 'stable';
    }

    // Simple trend: compare first half average to second half average
    const midpoint = Math.floor(entries.length / 2);
    const firstHalf = entries.slice(0, midpoint);
    const secondHalf = entries.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, e) => sum + e.gasCost, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.gasCost, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    const percentChange = (difference / firstAvg) * 100;

    if (percentChange > 5) {
      return 'increasing';
    } else if (percentChange < -5) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  /**
   * Get most expensive operations
   */
  getMostExpensive(limit: number = 10): GasCostStats[] {
    return this.getAllStats()
      .sort((a, b) => b.averageGas - a.averageGas)
      .slice(0, limit);
  }

  /**
   * Get least expensive operations
   */
  getLeastExpensive(limit: number = 10): GasCostStats[] {
    return this.getAllStats()
      .sort((a, b) => a.averageGas - b.averageGas)
      .slice(0, limit);
  }

  /**
   * Export gas cost data
   */
  export(): string {
    const data = {
      gasCosts: Array.from(this.gasCosts.entries()).map(([operation, entries]) => ({
        operation,
        entries,
        stats: this.getStats(operation),
      })),
      allStats: this.getAllStats(),
      timestamp: Date.now(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear old entries
   */
  clearOld(keepCount: number = 1000): void {
    for (const [operation, entries] of this.gasCosts.entries()) {
      if (entries.length > keepCount) {
        const newEntries = entries.slice(-keepCount);
        this.gasCosts.set(operation, newEntries);
      }
    }
  }

  /**
   * Reset all data
   */
  reset(): void {
    this.gasCosts.clear();
  }
}

/**
 * Global gas cost tracker instance
 */
export const gasCostTracker = new GasCostTracker();
