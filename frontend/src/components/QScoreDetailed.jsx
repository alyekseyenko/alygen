import { ChevronDown, ChevronUp, TrendingUp, Search, Shield, Users, Zap, Target, Award } from 'lucide-react'
import { useState } from 'react'

export default function QScoreDetailed({ qScore }) {
  const [expandedCategories, setExpandedCategories] = useState({})

  if (!qScore) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 text-center text-muted-foreground">
        Q Score data not available
      </div>
    )
  }

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  if (qScore.scores) {
    const categories = [
      { key: 'performance', label: 'Performance', icon: TrendingUp },
      { key: 'seo', label: 'SEO', icon: Search },
      { key: 'security', label: 'Segurança', icon: Shield },
      { key: 'accessibility', label: 'Acessibilidade', icon: Users },
      { key: 'tracking', label: 'Tracking', icon: Zap },
      { key: 'conversion', label: 'Conversão', icon: Target }
    ];

    return (
      <div className="space-y-3">
        {categories.map(({ key, label, icon: Icon }) => {
          const score = qScore.scores[key] || 0;
          const isExpanded = expandedCategories[key];

          return (
            <div key={key} className="bg-card border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(key)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Icon className="w-5 h-5 text-white" />
                  <span className="text-lg font-medium text-white">{label}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-500"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {Math.round(score)}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground ml-3" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground ml-3" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                    <p className="text-sm text-white">
                      {getDescription(key, score)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {qScore.weights && (
          <div className="bg-card border border-accent/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-accent" />
              <h4 className="font-semibold text-white">Dynamic Weights ({qScore.sectorName})</h4>
            </div>
            <div className="space-y-2">
              {Object.entries(qScore.weights).map(([key, weight]) => (
                <div key={key} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground capitalize">{key}</span>
                  <span className="font-bold text-accent">{Math.round(weight * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 text-center">
      <p className="text-muted-foreground mb-2">Basic Q Score</p>
      <p className="text-5xl font-bold text-white mb-2">{qScore.score}</p>
      <p className="text-lg font-bold text-accent">{qScore.grade}</p>
      <p className="text-sm text-muted-foreground mt-2">{qScore.category}</p>
    </div>
  )
}

function getDescription(category, score) {
  const descriptions = {
    performance: score >= 90 ? 'Excellent! Site loads quickly on all devices.' :
                 score >= 70 ? 'Good performance, but room for optimization.' :
                 score >= 50 ? 'Below average performance. Users may abandon the site.' :
                 'Critical! Site very slow, hurts conversions.',
    
    seo: score >= 90 ? 'Professional SEO optimization. Excellent Google visibility.' :
         score >= 70 ? 'Solid SEO, but can improve rankings.' :
         score >= 50 ? 'Basic SEO. Losing organic traffic.' :
         'Critical SEO. Site practically invisible on Google.',
    
    security: score >= 90 ? 'Enterprise-grade security. Clients can trust.' :
              score >= 70 ? 'Adequate security, but can be strengthened.' :
              score >= 50 ? 'Vulnerabilities present. Moderate risk.' :
              'Critical! Insecure site, can be hacked.',
    
    accessibility: score >= 90 ? 'Fully accessible. Includes all users.' :
                   score >= 70 ? 'Good accessibility, minor adjustments needed.' :
                   score >= 50 ? 'Limited accessibility. Excludes part of the audience.' :
                   'Inaccessible to many users. Loses 15% of the market.',
    
    tracking: score >= 90 ? 'Complete tracking! Accurate data for decisions.' :
              score >= 70 ? 'Good tracking, but missing some tools.' :
              score >= 50 ? 'Basic tracking. Limited data.' :
              'No tracking! Flying blind.',
    
    conversion: score >= 90 ? 'Conversion optimized. Sales machine!' :
                score >= 70 ? 'Good conversion rate, can optimize more.' :
                score >= 50 ? 'Below average conversion. Losing sales.' :
                'Critical! Site doesn\'t convert visitors to customers.'
  };
  
  return descriptions[category] || 'No description available.';
}
