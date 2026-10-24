export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-accent-gradient text-white hover:brightness-110 active:brightness-95 shadow-glow',
    secondary: 'bg-surface-raised text-text-hi border border-line hover:bg-surface-hover',
    ghost: 'text-text-mid hover:text-text-hi hover:bg-surface-raised',
    danger: 'bg-state-danger/10 text-state-danger border border-state-danger/30 hover:bg-state-danger/20',
  }
  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-5 py-3',
  }
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}
