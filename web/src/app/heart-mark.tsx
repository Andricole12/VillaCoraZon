export function HeartMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 64 64"
    >
      <path d="M32 47S13 36 13 22a10 10 0 0 1 19-4 10 10 0 0 1 19 4c0 14-19 25-19 25Z" />
      <path d="M4 28h10m36 0h10M10 21c4-5 8-7 14-8m30 8c-4-5-8-7-14-8" />
      <path d="M13 18c4-1 7 0 9 4-4 2-7 1-9-4Zm38 0c-4-1-7 0-9 4 4 2 7 1 9-4Z" />
    </svg>
  );
}