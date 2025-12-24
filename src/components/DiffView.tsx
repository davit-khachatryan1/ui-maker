import { diffLines } from 'diff';

interface DiffViewProps {
  before: string;
  after: string;
}

export function DiffView({ before, after }: DiffViewProps) {
  const changes = diffLines(before, after);

  return (
    <pre className="h-[360px] overflow-auto rounded-2xl bg-slate-950/90 p-4 text-xs text-slate-100 shadow-inner">
      {changes.map((part, index) => {
        const className = part.added
          ? 'text-emerald-300'
          : part.removed
            ? 'text-rose-300'
            : 'text-slate-200';
        return (
          <span key={`${index}-${part.value.slice(0, 10)}`} className={className}>
            {part.value}
          </span>
        );
      })}
    </pre>
  );
}
