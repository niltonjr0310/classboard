export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect
        x="0.75" y="0.75" width="62.5" height="62.5" rx="16"
        fill="#141A38" stroke="#2A3263" strokeWidth="1.5"
      />
      <path
        d="M32 19L19 43M32 19L45 43M19 43H45"
        stroke="#6C74B8" strokeWidth="3.5" strokeLinecap="round" fill="none"
      />
      <circle cx="32" cy="19" r="7" fill="#6D5DFC" />
      <circle cx="19" cy="43" r="7" fill="#10B981" />
      <circle cx="45" cy="43" r="7" fill="#A855F7" />
    </svg>
  );
}
