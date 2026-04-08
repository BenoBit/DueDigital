export default function SearchBar({ value, onChange, onSubmit, loading, compact = false }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(value)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={compact ? 'Search company…' : 'Company name or ticker (e.g. ServiceTitan, Figma, $SQ)'}
          disabled={loading}
          className={`
            w-full bg-gray-900 border border-gray-700 rounded-lg
            text-gray-100 placeholder-gray-600 font-mono
            focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-3 text-sm'}
          `}
          autoFocus={!compact}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className={`
          rounded-lg font-semibold
          bg-amber-500 hover:bg-amber-400 text-gray-950
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-150 flex items-center gap-1.5 shrink-0
          ${compact ? 'px-3 py-1.5 text-xs' : 'px-5 py-3 text-sm'}
        `}
      >
        {loading ? (
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
          </svg>
        )}
        {!compact && (loading ? 'Screening…' : 'Screen')}
      </button>
    </form>
  )
}
