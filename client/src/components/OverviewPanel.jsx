import Panel from './Panel'

export default function OverviewPanel({ overview }) {
  return (
    <Panel title="Business Overview" icon="🏢">
      <p className="text-gray-300 text-sm leading-relaxed">{overview}</p>
    </Panel>
  )
}
