import { cn } from "@/lib/utils";

type Props = {
  clue: string;
  storytellerName: string;
  storytellerAvatar?: string | null | undefined;
  className?: string | undefined;
};

/**
 * Pista del narrador: compacta y persistente durante la selección y la votación.
 */
export function ClueBanner({ clue, storytellerName, storytellerAvatar, className }: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-primary/30 bg-card/80 px-3 py-2 backdrop-blur-sm",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-lg"
      >
        {storytellerAvatar || storytellerName.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-muted-foreground">{storytellerName}</p>
        <p className="font-display truncate text-base leading-tight sm:text-lg">
          <span className="text-gradient-gold">“{clue}”</span>
        </p>
      </div>
    </div>
  );
}
