export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      <span className="h-1.5 w-1.5 rounded-full bg-pine-400 animate-typing-bounce [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-pine-400 animate-typing-bounce [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-pine-400 animate-typing-bounce" />
    </span>
  );
}
