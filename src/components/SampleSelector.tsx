import React from 'react';
import { SAMPLE_TEMPLATES, SampleTemplate } from '../data/sampleTexts';
import { FileCode, Sparkles } from 'lucide-react';

interface SampleSelectorProps {
  onSelect: (sample: SampleTemplate) => void;
  disabled?: boolean;
}

export const SampleSelector: React.FC<SampleSelectorProps> = ({ onSelect, disabled = false }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
          Or try a sample text snippet:
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {SAMPLE_TEMPLATES.map((sample) => (
          <button
            key={sample.id}
            id={`btn-sample-${sample.id}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(sample)}
            className="text-left p-2.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="font-semibold text-xs text-zinc-800 group-hover:text-zinc-950 truncate">
                {sample.name}
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 shrink-0">
                {sample.badge}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
              {sample.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
