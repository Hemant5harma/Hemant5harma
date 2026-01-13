import React, { useState, useEffect } from 'react';
import { TrendingDown, BarChart3, Target, TrendingUp, Activity } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

// Define condition types with their configurations
export const CONDITION_TYPES = [
  {
    value: 'price_drop',
    label: 'Price Drop %',
    description: 'Buy when price drops by specified percentage',
    icon: TrendingDown,
    defaultParams: { threshold: 5.0 },
  },
  {
    value: 'rsi_oversold',
    label: 'RSI Oversold',
    description: 'Buy when RSI indicates oversold conditions',
    icon: BarChart3,
    defaultParams: { rsi_threshold: 30, timeframe: '1h' },
  },
  {
    value: 'volume_spike',
    label: 'Volume Spike',
    description: 'Buy when trading volume increases significantly',
    icon: Activity,
    defaultParams: { volume_multiplier: 2.0, timeframe: '24h' },
  },
  {
    value: 'support_level',
    label: 'Support Level',
    description: 'Buy when price hits predefined support level',
    icon: Target,
    defaultParams: { support_price: 1.0, tolerance: 0.02 },
  },
  {
    value: 'moving_average_cross',
    label: 'MA Cross',
    description: 'Buy on moving average crossover signal',
    icon: TrendingUp,
    defaultParams: { fast_ma: 20, slow_ma: 50, timeframe: '1h' },
  },
];

interface ConditionBuilderProps {
  value: {
    condition_type: string;
    condition_params: any;
  };
  onChange: (value: { condition_type: string; condition_params: any }) => void;
  className?: string;
}

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ value, onChange, className = '' }) => {
  const [selectedCondition, setSelectedCondition] = useState(
    CONDITION_TYPES.find((c) => c.value === value.condition_type) || CONDITION_TYPES[0],
  );
  const [params, setParams] = useState(value.condition_params || selectedCondition.defaultParams);

  useEffect(() => {
    const condition = CONDITION_TYPES.find((c) => c.value === value.condition_type);
    if (condition) {
      setSelectedCondition(condition);
      setParams(value.condition_params || condition.defaultParams);
    }
  }, [value.condition_type, value.condition_params]);

  const handleConditionChange = (conditionValue: string | null) => {
    if (!conditionValue) return;

    const condition = CONDITION_TYPES.find((c) => c.value === conditionValue);
    if (condition) {
      setSelectedCondition(condition);
      const newParams = condition.defaultParams;
      setParams(newParams);
      onChange({
        condition_type: conditionValue,
        condition_params: newParams,
      });
    }
  };

  const handleParamChange = (paramKey: string, paramValue: any) => {
    const newParams = { ...params, [paramKey]: paramValue };
    setParams(newParams);
    onChange({
      condition_type: value.condition_type,
      condition_params: newParams,
    });
  };

  const renderParameterInputs = () => {
    const IconComponent = selectedCondition.icon;

    return (
      <div className="space-y-4">
        {/* Condition Type Selection */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <IconComponent className="h-4 w-4 text-text-light-secondary dark:text-text-dark-secondary" />
            <label className="text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
              Trading Condition
            </label>
          </div>
          <CustomDropdown
            options={CONDITION_TYPES.map((condition) => ({
              value: condition.value,
              label: condition.label,
            }))}
            value={selectedCondition.value}
            onChange={(value) => handleConditionChange(value as string)}
            placeholder="Select condition type"
          />
          <p className="mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            {selectedCondition.description}
          </p>
        </div>

        {/* Dynamic Parameter Inputs */}
        <div className="space-y-3">
          {selectedCondition.value === 'price_drop' && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                Price Drop Threshold (%)
              </label>
              <input
                type="number"
                value={params.threshold || 5.0}
                onChange={(e) => handleParamChange('threshold', parseFloat(e.target.value) || 0)}
                min={0.1}
                max={50}
                step={0.1}
                placeholder="5.0"
                className="w-full rounded-xl border-2 border-border-light bg-card-light px-4 py-3 text-text-light-primary transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
              />
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Buy when price drops by this percentage in 24h
              </p>
            </div>
          )}

          {selectedCondition.value === 'rsi_oversold' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                  RSI Threshold
                </label>
                <input
                  type="number"
                  value={params.rsi_threshold || 30}
                  onChange={(e) => handleParamChange('rsi_threshold', parseInt(e.target.value) || 0)}
                  min={10}
                  max={50}
                  step={1}
                  placeholder="30"
                  className="w-full rounded-xl border-2 border-border-light bg-card-light px-4 py-3 text-text-light-primary transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
                />
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  Buy when RSI falls below this level
                </p>
              </div>
              <div className="space-y-2">
                <CustomDropdown
                  label="Timeframe"
                  options={[
                    { value: '15m', label: '15 minutes' },
                    { value: '1h', label: '1 hour' },
                    { value: '4h', label: '4 hours' },
                    { value: '1d', label: '1 day' },
                  ]}
                  value={params.timeframe || '1h'}
                  onChange={(value) => handleParamChange('timeframe', value as string)}
                  placeholder="Select timeframe"
                />
              </div>
            </>
          )}

          {selectedCondition.value === 'volume_spike' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                  Volume Multiplier
                </label>
                <input
                  type="number"
                  value={params.volume_multiplier || 2.0}
                  onChange={(e) => handleParamChange('volume_multiplier', parseFloat(e.target.value) || 0)}
                  min={1.1}
                  max={10}
                  step={0.1}
                  placeholder="2.0"
                  className="w-full rounded-xl border-2 border-border-light bg-card-light px-4 py-3 text-text-light-primary transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
                />
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  Buy when volume is X times higher than average
                </p>
              </div>
              <div className="space-y-2">
                <CustomDropdown
                  label="Timeframe"
                  options={[
                    { value: '1h', label: '1 hour' },
                    { value: '4h', label: '4 hours' },
                    { value: '24h', label: '24 hours' },
                  ]}
                  value={params.timeframe || '24h'}
                  onChange={(value) => handleParamChange('timeframe', value as string)}
                  placeholder="Select timeframe"
                />
              </div>
            </>
          )}

          {selectedCondition.value === 'support_level' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                  Support Price (USDT)
                </label>
                <input
                  type="number"
                  value={params.support_price || 1.0}
                  onChange={(e) => handleParamChange('support_price', parseFloat(e.target.value) || 0)}
                  min={0.0001}
                  step={0.0001}
                  placeholder="1.0000"
                  className="w-full rounded-xl border-2 border-border-light bg-card-light px-4 py-3 text-text-light-primary transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
                />
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  Target support level to buy at
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                  Tolerance (%)
                </label>
                <input
                  type="number"
                  value={((params.tolerance || 0.02) * 100).toFixed(1)}
                  onChange={(e) => {
                    const numValue = parseFloat(e.target.value) || 2;
                    handleParamChange('tolerance', numValue / 100);
                  }}
                  min={0.1}
                  max={10}
                  step={0.1}
                  placeholder="2.0"
                  className="w-full rounded-xl border-2 border-border-light bg-card-light px-4 py-3 text-text-light-primary transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
                />
                <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  Price tolerance around support level
                </p>
              </div>
            </>
          )}

          {selectedCondition.value === 'moving_average_cross' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                  Fast MA Period
                </label>
                <input
                  type="number"
                  value={params.fast_ma || 20}
                  onChange={(e) => handleParamChange('fast_ma', parseInt(e.target.value) || 0)}
                  min={5}
                  max={100}
                  step={1}
                  placeholder="20"
                  className="w-full rounded-xl border-2 border-border-light bg-card-light px-4 py-3 text-text-light-primary transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                  Slow MA Period
                </label>
                <input
                  type="number"
                  value={params.slow_ma || 50}
                  onChange={(e) => handleParamChange('slow_ma', parseInt(e.target.value) || 0)}
                  min={20}
                  max={200}
                  step={1}
                  placeholder="50"
                  className="w-full rounded-xl border-2 border-border-light bg-card-light px-4 py-3 text-text-light-primary transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 dark:border-border-dark dark:bg-card-dark dark:text-text-dark-primary"
                />
              </div>
              <div className="space-y-2">
                <CustomDropdown
                  label="Timeframe"
                  options={[
                    { value: '15m', label: '15 minutes' },
                    { value: '1h', label: '1 hour' },
                    { value: '4h', label: '4 hours' },
                    { value: '1d', label: '1 day' },
                  ]}
                  value={params.timeframe || '1h'}
                  onChange={(value) => handleParamChange('timeframe', value as string)}
                  placeholder="Select timeframe"
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-xl border-2 border-border-light bg-card-light p-4 dark:border-border-dark dark:bg-card-dark ${className}`}>
      {renderParameterInputs()}
    </div>
  );
};

export default ConditionBuilder;
