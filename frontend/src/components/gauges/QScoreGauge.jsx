import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function QScoreGauge({ score = 0, grade = 'N/A', size = 'large', showLabel = true, animated = true }) {
  const normalizedScore = Math.min(Math.max(score, 0), 100)

  // Configurações de tamanho
  const sizes = {
    large: { width: 280, height: 180, innerRadius: 70, outerRadius: 100, fontSize: '4rem', gradeSize: '1.5rem' },
    medium: { width: 200, height: 130, innerRadius: 50, outerRadius: 70, fontSize: '2.5rem', gradeSize: '1rem' },
    small: { width: 120, height: 80, innerRadius: 30, outerRadius: 45, fontSize: '1.5rem', gradeSize: '0.75rem' }
  }

  const config = sizes[size]

  // Dados do gauge (semicírculo)
  const data = [
    { value: normalizedScore, fill: getScoreColor(normalizedScore) },
    { value: 100 - normalizedScore, fill: '#1a1a1a' }
  ]

  // Zonas de cor de fundo
  const backgroundZones = [
    { value: 40, fill: '#FF4F00', opacity: 0.15 },  // Crítico
    { value: 20, fill: '#FFFFFF', opacity: 0.05 },  // Baixo
    { value: 20, fill: '#FFFFFF', opacity: 0.08 },  // Médio
    { value: 20, fill: '#FFFFFF', opacity: 0.12 }   // Excelente
  ]

  return (
    <div className="relative flex flex-col items-center justify-center">
      <ResponsiveContainer width={config.width} height={config.height}>
        <PieChart>
          {/* Fundo com zonas */}
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

          {/* Gauge principal */}
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
            animationDuration={animated ? 1500 : 0}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Valor central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ marginTop: size === 'large' ? '20px' : size === 'medium' ? '10px' : '5px' }}>
        <div
          className="font-bold text-white transition-all duration-1000"
          style={{ fontSize: config.fontSize }}
        >
          {Math.round(normalizedScore)}
        </div>
        {showLabel && (
          <div
            className="font-bold text-accent mt-1"
            style={{ fontSize: config.gradeSize }}
          >
            {grade}
          </div>
        )}
      </div>

      {/* Marcadores de zona */}
      {size === 'large' && (
        <div className="flex justify-between w-full px-4 mt-2 text-xs text-muted-foreground">
          <span>0</span>
          <span className="text-accent">40</span>
          <span>60</span>
          <span>80</span>
          <span>100</span>
        </div>
      )}
    </div>
  )
}

function getScoreColor(score) {
  if (score >= 80) return '#FFFFFF'      // Excelente - Branco brilhante
  if (score >= 60) return '#CCCCCC'      // Médio - Branco médio
  if (score >= 40) return '#999999'      // Baixo - Branco escuro
  return '#FF4F00'                       // Crítico - Accent
}
