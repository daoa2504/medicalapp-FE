

interface GaugeChartProps {
  value: number;  // 0-100
  title: string;
}

export function GaugeChart({ value, title }: GaugeChartProps) {
  // Limiter la valeur entre 0 et 100
  const clampedValue = Math.min(100, Math.max(0, value));
  
  // Déterminer la couleur selon 3 niveaux
  const getColor = (val: number): string => {
    if (val < 30) return '#22c55e';      // green-500 - Faible
    if (val < 60) return '#eab308';      // yellow-500 - Modéré
    return '#ef4444';                     // red-500 - Élevé
  };

  const color = getColor(clampedValue);
  
  // Calcul de l'angle pour le semi-cercle (180° = 0%, 0° = 100%)
  const angle = 180 - (clampedValue * 1.8); // 1.8 = 180/100
  
  return (
    <div className="flex flex-col items-center">
      {/* Titre */}
      <h4 className="text-lg font-semibold text-gray-200 mb-4 text-center">
        {title}
      </h4>
      
      {/* Conteneur de la jauge */}
      <div className="relative w-48 h-24">
        {/* Arc de fond (gris) */}
        <svg className="w-full h-full" viewBox="0 0 200 100">
          {/* Fond gris */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="#374151"
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* Arc coloré selon la valeur */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke={color}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={`${clampedValue * 2.51} 251`}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Aiguille */}
          <line
            x1="100"
            y1="90"
            x2="100"
            y2="30"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle} 100 90)`}
            className="transition-transform duration-1000 ease-out"
          />
          
          {/* Point central */}
          <circle cx="100" cy="90" r="5" fill="#ffffff" />
        </svg>
        
        {/* Valeur affichée au centre */}
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color }}>
              {clampedValue.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Labels des extrémités */}
      <div className="w-48 flex justify-between mt-2 text-xs text-gray-500">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}