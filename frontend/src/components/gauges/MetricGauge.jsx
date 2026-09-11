import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function MetricGauge({
  score = 0,
  label = '',
  icon: Icon,
  size = 'medium',
  animated = true
}) {
  const normalizedScore = Math.min(Math.max(score, 0), 100)

  const sizes = {
    medium: { width: 160, height: 110, innerRadius: 45, outerRadius: 60, fontSize: '2rem' },
    small: { width: 100, height: 70, innerRadius: 28, outerRadius: 38, fontSize: '1.25rem' }
  }

  const config = sizes[size]

  const data = [
    { value: normalizedScore, fill: getScoreColor(normalizedScore) },
    { value: 100 - normalizedScore, fill: '#1a1a1a' }
  ]

  const backgroundZones = [
    { value: 40, fill: '#FF4F00', opacity: 0.15 },
    { value: 20, fill: '#FFFFFF', opacity: 0.05 },
    { value: 20, fill: '#FFFFFF', opacity: 0.08 },
    { value: 20, fill: '#FFFFFF', opacity: 0.12 }
  ]

  return (
    <div className="flex flex-col items-center">
      {label && (
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className="w-4 h-4 text-white" />}
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
      )}

      <div className="relative">
        <ResponsiveContainer width={config.width} height={config.height}>
          <PieChart>
            <Pie
              data={backgroundZones}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius={config.innerRadius}
              outerRadius={config.outerRadius}
              dataKey="value"
              stroke="none"
            >
              {backgroundZones.map((entry, index) => (
                <Cell key={`bg-${index}`} fill={entry.fill} opacity={entry.opacity} />
              ))}
            </Pie>

            <Pie
              data={data}
              cx="50%"
              cy="85%"
              startAngle={180}
              endAngle={0}
              innerRadius={config.innerRadius}
              outerRadius={config.outerRadius}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={animated ? 1200 : 0}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: size === 'medium' ? '8px' : '5px' }}>
          <div
            className="font-bold text-white"
            style={{ fontSize: config.fontSize }}
          >
            {Math.round(normalizedScore)}
          </div>
        </div>
      </div>
    </div>
  )
}

function getScoreColor(score) {
  if (score >= 80) return '#FFFFFF'
  if (score >= 60) return '#CCCCCC'
  if (score >= 40) return '#999999'
  return '#FF4F00'
}
