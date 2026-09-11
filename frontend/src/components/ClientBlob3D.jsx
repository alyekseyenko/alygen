import React, { useRef, useMemo, Suspense, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Sphere, Float, OrbitControls, Environment } from '@react-three/drei'

// Error Boundary para Three.js
class ThreeErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Three.js Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <div className="text-red-500 text-sm p-4 text-center">
            <p className="font-bold mb-2">Erro ao carregar visualização 3D</p>
            <p className="text-xs text-white/50">{this.state.error?.message || 'Erro desconhecido'}</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Partículas flutuantes baseadas em tracking
function TrackingParticles({ count, color }) {
  const particlesRef = useRef()
  const particlesCount = Math.max(0, Math.min(1000, (count || 0) * 10))
  
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3)
    for (let i = 0; i < particlesCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    return pos
  }, [particlesCount])
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })
  
  if (count === 0 || particlesCount === 0) return null
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={color} transparent opacity={0.6} />
    </points>
  )
}

function AnimatedBlob({ analysis }) {
  const meshRef = useRef()
  const innerGlowRef = useRef()
  
  // Configuração baseada em dados (SEM Lighthouse Audits)
  const config = useMemo(() => {
    const qScore = Number(analysis?.qScoreAdvanced?.score || analysis?.qScore?.score || 0)
    const performanceMobile = Number(analysis?.performanceMobile || 0)
    const performanceDesktop = Number(analysis?.performanceScore || 0)
    const tracking = Number(analysis?.pixelDetails?.totalTracking || 0)
    const seoScore = Number(analysis?.seo?.score || 0)
    const securityScore = Number(analysis?.security?.score || 0)
    const accessibilityScore = Number(analysis?.accessibility?.score || 0)
    const hasSSL = Boolean(analysis?.security?.hasSSL)
    
    // Performance média
    const avgPerformance = (performanceMobile + performanceDesktop) / 2
    
    // COR: Gradiente baseado em Q Score
    let color = '#fed7aa'
    if (qScore >= 80) color = '#ff6b00'
    else if (qScore >= 60) color = '#f97316'
    else if (qScore >= 40) color = '#fb923c'
    
    // DISTORÇÃO: Baseada em performance
    const distort = 0.3 + (100 - avgPerformance) / 120
    
    // VELOCIDADE: Baseada em tracking + SEO
    const speed = 1.2 + (tracking / 10) + (seoScore / 200)
    
    // TAMANHO: Baseado em SEO score
    const radius = 1.5 + (seoScore / 100) * 0.5
    
    // BRILHO: Baseado em Q Score + Security
    const emissive = qScore >= 70 || securityScore >= 90 ? color : '#000000'
    const emissiveIntensity = (qScore + securityScore) / 200
    
    // METALNESS: Baseado em accessibility
    const metalness = 0.7 + (accessibilityScore / 200)
    
    // ROUGHNESS: Baseado em performance
    const roughness = 0.4 - (avgPerformance / 250)
    
    // OPACIDADE: Baseada em tracking
    const opacity = 0.85 + (tracking / 70)
    
    return {
      color,
      distort: Math.max(0, Math.min(1, distort)),
      speed: Math.max(0.1, speed),
      radius: Math.max(0.5, radius),
      emissive,
      emissiveIntensity: Math.max(0, Math.min(1, emissiveIntensity)),
      metalness: Math.max(0, Math.min(1, metalness)),
      roughness: Math.max(0, Math.min(1, roughness)),
      opacity: Math.max(0.1, Math.min(1, opacity)),
      hasSSL,
      seoScore,
      securityScore,
      accessibilityScore,
      tracking
    }
  }, [analysis])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05
      meshRef.current.scale.set(pulse, pulse, pulse)
    }
    
    if (innerGlowRef.current) {
      const glowPulse = 0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.2
      innerGlowRef.current.scale.set(glowPulse, glowPulse, glowPulse)
    }
  })
  
  return (
    <>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Inner Glow */}
        {config.securityScore > 70 && (
          <Sphere ref={innerGlowRef} args={[config.radius * 0.9, 64, 64]}>
            <meshBasicMaterial 
              color={config.emissive} 
              transparent 
              opacity={0.3}
            />
          </Sphere>
        )}
        
        {/* Main Blob */}
        <Sphere ref={meshRef} args={[config.radius, 128, 128]}>
          <MeshDistortMaterial
            color={config.color}
            emissive={config.emissive}
            emissiveIntensity={config.emissiveIntensity}
            distort={config.distort}
            speed={config.speed}
            roughness={config.roughness}
            metalness={config.metalness}
            clearcoat={config.hasSSL ? 1 : 0.5}
            clearcoatRoughness={0.1}
            transparent
            opacity={config.opacity}
          />
        </Sphere>
      </Float>
      
      {/* Partículas de tracking */}
      <TrackingParticles count={config.tracking} color={config.color} />
    </>
  )
}

export default function ClientBlob3D({ analysis, leadData }) {
  const [error, setError] = useState(null)
  
  if (!analysis) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-orange-500 text-xl">Carregando análise...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-red-500 text-sm p-4 text-center">
          <p className="font-bold mb-2">Erro ao carregar visualização 3D</p>
          <p className="text-xs text-white/50">{error.message}</p>
        </div>
      </div>
    )
  }
  
  const qScore = analysis?.qScoreAdvanced?.score || analysis?.qScore?.score || 0
  
  return (
    <div className="w-full h-full relative bg-black">
      <ThreeErrorBoundary>
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-orange-500 text-xl">Carregando 3D...</div>
          </div>
        }>
          <Canvas
            camera={{ position: [0, 5, 0], fov: 75, up: [0, 0, 1] }}
            style={{ width: '100%', height: '100%' }}
            gl={{ antialias: true, alpha: true }}
            onCreated={({ gl, camera }) => {
              gl.setClearColor('#000000', 1)
              camera.lookAt(0, 0, 0)
            }}
          >
            <color attach="background" args={['#000000']} />
            <fog attach="fog" args={['#000000', 8, 20]} />
            
            {/* Iluminação */}
            <ambientLight intensity={0.1} />
            <directionalLight position={[5, 5, 5]} intensity={2.5} color="#f97316" />
            <directionalLight position={[-5, -5, -5]} intensity={1.2} color="#fb923c" />
            <pointLight position={[0, 0, -10]} intensity={0.8} color="#ff6b00" />
            <spotLight 
              position={[0, 10, 0]} 
              intensity={2} 
              angle={0.5} 
              penumbra={1} 
              color="#f97316"
            />
            
            <AnimatedBlob analysis={analysis} />
            
            <Environment preset="night" background={false} />
            
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
          </Canvas>
        </Suspense>
      </ThreeErrorBoundary>
      
      {/* Debug info */}
      <div className="absolute top-4 left-4 text-white text-xs bg-black/50 p-2 rounded">
        Q Score: {qScore}
      </div>
    </div>
  )
}
