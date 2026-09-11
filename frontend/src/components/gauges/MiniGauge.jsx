import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function MiniGauge({ score = 0, showValue = true }) {
  const normalizedScore = Math.min(Math.max(score, 0), 100)

  const data = [
    { value: normalizedScore, fill: getScoreColor(normalizedScore) },
    { value: 100 - normalizedScore, fill: '#1a1a1a' }
  ]

  return (
    <div className="relative inline-flex items-center justify-center">
      <ResponsiveContainer width={60} height={40}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="85%"
            startAngle={180}
            endAngle={0}
            innerRadius={18}
            outerRadius={25}
            dataKey="value"
            stroke="none"
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '2px' }}>
          <span className="text-xs font-bold text-white">
            {Math.round(normalizedScore)}
          </span>
        </div>
      )}
    </div>
  )
}

function getScoreColor(score) {
  if (score >= 80) return '#FFFFFF'
  if (score >= 60) return '#CCCCCC'
  if (score >= 40) return '#999999'
  return '#FF4F00'
}
