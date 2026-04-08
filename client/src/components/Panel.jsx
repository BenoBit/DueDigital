export default function Panel({ title, icon, children, className = '', headerRight }) {
  return (
    <div className={`rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80">
        <div className="flex items-center gap-2">
          {icon && <span className="text-sm">{icon}</span>}
          <span className="text-xs font-bold font-mono text-gray-400 uppercase tracking-widest">
            {title}
          </span>
        </div>
        {headerRight}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
