import LimitCheckerImpl from '../LimitCheckerImpl';
import { options } from '../logger';
options.enabled = false;

describe('LimitCheckerImpl', () => {
  test('MaxTargetVolumeLimit - violate', () => {
    const config = { maxTargetVolumePercent: 50 };
    const ps = {};
    const analysisResult = { availableVolume: 1.0, targetVolume: 0.7 };
    const checker = new LimitCheckerImpl({ config }, ps, analysisResult, analysisResult, false);
    checker.limits = checker.limits.filter(limit => limit.constructor.name === 'MaxTargetVolumeLimit');
    const result = checker.check();
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Too large Volume');
  });

  test('MaxTargetVolumeLimit - pass', () => {
    const config = { maxTargetVolumePercent: 50 };
    const ps = {};
    const analysisResult = { availableVolume: 1.0, targetVolume: 0.3 };
    const checker = new LimitCheckerImpl({ config }, ps, analysisResult, analysisResult, false);
    checker.limits = checker.limits.filter(limit => limit.constructor.name === 'MaxTargetVolumeLimit');
    const result = checker.check();
    expect(result.success).toBe(true);
    expect(result.reason).toBe('');
  });

  test('MaxTargetVolumeLimit - undefined', () => {
    const config = { maxTargetVolumePercent: undefined };
    const ps = {};
    const analysisResult = { availableVolume: 1.0, targetVolume: 0.3 };
    const checker = new LimitCheckerImpl({ config }, ps, analysisResult, analysisResult, false);
    checker.limits = checker.limits.filter(limit => limit.constructor.name === 'MaxTargetVolumeLimit');
    const result = checker.check();
    expect(result.success).toBe(true);
    expect(result.reason).toBe('');
  });
});
