import React, { useState, useEffect } from 'react';
import { Select, NumberInput } from '@mantine/core';
import { TrendingDown, BarChart3, Target, TrendingUp, Activity } from 'lucide-react';

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
          <label className="mb-2 block flex items-center text-sm font-medium">
            <IconComponent className="mr-2 h-4 w-4" />
            Trading Condition
          </label>
          <Select
            value={selectedCondition.value}
            onChange={handleConditionChange}
            data={CONDITION_TYPES.map((condition) => ({
              value: condition.value,
              label: condition.label,
            }))}
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {selectedCondition.description}
          </p>
        </div>

        {/* Dynamic Parameter Inputs */}
        <div className="space-y-3">
          {selectedCondition.value === 'price_drop' && (
            <div>
              <label className="mb-1 block text-xs font-medium">Price Drop Threshold (%)</label>
              <NumberInput
                value={params.threshold || 5.0}
                onChange={(value) => handleParamChange('threshold', value)}
                min={0.1}
                max={50}
                step={0.1}
                placeholder="5.0"
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                Buy when price drops by this percentage in 24h
              </p>
            </div>
          )}

          {selectedCondition.value === 'rsi_oversold' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium">RSI Threshold</label>
                <NumberInput
                  value={params.rsi_threshold || 30}
                  onChange={(value) => handleParamChange('rsi_threshold', value)}
                  min={10}
                  max={50}
                  step={1}
                  placeholder="30"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">Buy when RSI falls below this level</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Timeframe</label>
                <Select
                  value={params.timeframe || '1h'}
                  onChange={(value) => handleParamChange('timeframe', value)}
                  data={[
                    { value: '15m', label: '15 minutes' },
                    { value: '1h', label: '1 hour' },
                    { value: '4h', label: '4 hours' },
                    { value: '1d', label: '1 day' },
                  ]}
                  className="w-full"
                />
              </div>
            </>
          )}

          {selectedCondition.value === 'volume_spike' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium">Volume Multiplier</label>
                <NumberInput
                  value={params.volume_multiplier || 2.0}
                  onChange={(value) => handleParamChange('volume_multiplier', value)}
                  min={1.1}
                  max={10}
                  step={0.1}
                  placeholder="2.0"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Buy when volume is X times higher than average
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Timeframe</label>
                <Select
                  value={params.timeframe || '24h'}
                  onChange={(value) => handleParamChange('timeframe', value)}
                  data={[
                    { value: '1h', label: '1 hour' },
                    { value: '4h', label: '4 hours' },
                    { value: '24h', label: '24 hours' },
                  ]}
                  className="w-full"
                />
              </div>
            </>
          )}

          {selectedCondition.value === 'support_level' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium">Support Price (USDT)</label>
                <NumberInput
                  value={params.support_price || 1.0}
                  onChange={(value) => handleParamChange('support_price', value)}
                  min={0.0001}
                  step={0.0001}
                  placeholder="1.0000"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">Target support level to buy at</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Tolerance (%)</label>
                <NumberInput
                  value={(params.tolerance || 0.02) * 100}
                  onChange={(value) => {
                    const numValue =
                      typeof value === 'number'
                        ? value
                        : typeof value === 'string'
                          ? parseFloat(value)
                          : 2;
                    handleParamChange('tolerance', numValue / 100);
                  }}
                  min={0.1}
                  max={10}
                  step={0.1}
                  placeholder="2.0"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">Price tolerance around support level</p>
              </div>
            </>
          )}

          {selectedCondition.value === 'moving_average_cross' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium">Fast MA Period</label>
                <NumberInput
                  value={params.fast_ma || 20}
                  onChange={(value) => handleParamChange('fast_ma', value)}
                  min={5}
                  max={100}
                  step={1}
                  placeholder="20"
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Slow MA Period</label>
                <NumberInput
                  value={params.slow_ma || 50}
                  onChange={(value) => handleParamChange('slow_ma', value)}
                  min={20}
                  max={200}
                  step={1}
                  placeholder="50"
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Timeframe</label>
                <Select
                  value={params.timeframe || '1h'}
                  onChange={(value) => handleParamChange('timeframe', value)}
                  data={[
                    { value: '15m', label: '15 minutes' },
                    { value: '1h', label: '1 hour' },
                    { value: '4h', label: '4 hours' },
                    { value: '1d', label: '1 day' },
                  ]}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-xl bg-gray-50 p-4 dark:bg-gray-700 ${className}`}>
      {renderParameterInputs()}
    </div>
  );
};

export default ConditionBuilder;
