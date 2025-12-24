import type { Aggressiveness, AiProviderId } from '../api/ai';
import { aiProviders } from '../ai';

interface AiAssistPanelProps {
  enabled: boolean;
  provider: AiProviderId;
  model: string;
  aggressiveness: Aggressiveness;
  isRunning: boolean;
  error?: string | null;
  onToggle: (value: boolean) => void;
  onProviderChange: (value: AiProviderId) => void;
  onModelChange: (value: string) => void;
  onAggressivenessChange: (value: Aggressiveness) => void;
  onRun: () => void;
}

export function AiAssistPanel({
  enabled,
  provider,
  model,
  aggressiveness,
  isRunning,
  error,
  onToggle,
  onProviderChange,
  onModelChange,
  onAggressivenessChange,
  onRun
}: AiAssistPanelProps) {
  const providerConfig = aiProviders.find((item) => item.id === provider) ?? aiProviders[0];
  const models = providerConfig.models;
  const selectValue = models.includes(model) ? model : 'custom';
  const aggressivenessOptions: Aggressiveness[] = ['conservative', 'balanced', 'aggressive'];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">AI Assist</h3>
      <div className="mt-3 flex flex-col gap-3 text-sm text-slate-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} />
          Use AI Assist
        </label>

        <label className="flex flex-col gap-1">
          Provider
          <select
            value={provider}
            onChange={(event) => onProviderChange(event.target.value as AiProviderId)}
            className="rounded-xl border border-slate-200 px-3 py-2"
            disabled={!enabled}
          >
            {aiProviders.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        {provider === 'ollama' ? (
          <label className="flex flex-col gap-1">
            Model
            <input
              list="ollama-models"
              value={model}
              onChange={(event) => onModelChange(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2"
              disabled={!enabled}
            />
            <datalist id="ollama-models">
              {models.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1">
              Model
              <select
                value={selectValue}
                onChange={(event) => {
                  const next = event.target.value;
                  if (next !== 'custom') {
                    onModelChange(next);
                  }
                }}
                className="rounded-xl border border-slate-200 px-3 py-2"
                disabled={!enabled}
              >
                {models.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                {providerConfig.allowCustomModel ? <option value="custom">Custom</option> : null}
              </select>
            </label>
            {providerConfig.allowCustomModel && selectValue === 'custom' ? (
              <label className="flex flex-col gap-1">
                Custom model
                <input
                  value={model}
                  onChange={(event) => onModelChange(event.target.value)}
                  placeholder="Enter model id"
                  className="rounded-xl border border-slate-200 px-3 py-2"
                  disabled={!enabled}
                />
              </label>
            ) : null}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span>Aggressiveness</span>
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={aggressivenessOptions.indexOf(aggressiveness)}
            onChange={(event) =>
              onAggressivenessChange(
                aggressivenessOptions[Number(event.target.value)] ?? 'balanced'
              )
            }
            disabled={!enabled}
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>Conservative</span>
            <span>Balanced</span>
            <span>Aggressive</span>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Using backend proxy for cloud providers (keys never reach browser).
        </div>

        <button
          type="button"
          onClick={onRun}
          disabled={!enabled || isRunning}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-50"
        >
          {isRunning ? 'Running AI...' : 'Run AI cleanup'}
        </button>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
