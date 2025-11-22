import { cn } from '@/lib/utils';

interface PositionSelectorProps {
  value: string;
  onChange: (position: string) => void;
}

const positions = [
  { id: 'top-left', row: 0, col: 0 },
  { id: 'top-center', row: 0, col: 1 },
  { id: 'top-right', row: 0, col: 2 },
  { id: 'middle-left', row: 1, col: 0 },
  { id: 'middle-center', row: 1, col: 1 },
  { id: 'middle-right', row: 1, col: 2 },
  { id: 'bottom-left', row: 2, col: 0 },
  { id: 'bottom-center', row: 2, col: 1 },
  { id: 'bottom-right', row: 2, col: 2 },
];

export const PositionSelector = ({ value, onChange }: PositionSelectorProps) => {
  return (
    <div className="grid grid-cols-3 gap-1.5 w-32 mx-auto">
      {positions.map((position) => (
        <button
          key={position.id}
          type="button"
          onClick={() => onChange(position.id)}
          className={cn(
            "relative w-10 h-10 rounded border-2 transition-all duration-200",
            "hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent",
            value === position.id
              ? "bg-accent/20 border-accent shadow-lg"
              : "bg-background border-border hover:border-accent/50"
          )}
          aria-label={`Posição ${position.id}`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                value === position.id
                  ? "bg-accent scale-125"
                  : "bg-muted-foreground/40"
              )}
            />
          </div>
        </button>
      ))}
    </div>
  );
};