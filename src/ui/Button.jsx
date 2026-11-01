const VARIANTS = {
  primary: 'bg-accent-600 text-white hover:bg-accent-500 disabled:hover:bg-accent-600',
  secondary: 'bg-ink-800 text-ink-50 border border-ink-600 hover:bg-ink-700',
  ghost: 'text-ink-200 hover:bg-ink-800 hover:text-ink-50',
  danger: 'bg-danger-500 text-white hover:brightness-110',
};

export default function Button({ variant = 'secondary', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 h-9 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-accent-500 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

/** Square icon-only button. `label` is required: it becomes the tooltip and the accessible name. */
export function IconButton({ label, active = false, className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      aria-pressed={active || undefined}
      className={`inline-flex items-center justify-center rounded-md size-8 shrink-0 transition-colors disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-accent-500 ${
        active ? 'bg-accent-600/25 text-accent-400' : 'text-ink-200 hover:bg-ink-700 hover:text-ink-50'
      } ${className}`}
      {...props}
    />
  );
}
