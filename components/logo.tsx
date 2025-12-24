'use client';

export function SignalIntelligenceLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Stylized "S" Graphic */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-2"
      >
        {/* Outermost line (medium blue) - S curve from bottom left to top right */}
        <path
          d="M 8 40 Q 12 20, 24 22 Q 36 24, 40 8"
          stroke="#3B82F6"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="40" cy="8" r="2.5" fill="#3B82F6" />
        
        {/* Middle line (lighter blue) - parallel S curve */}
        <path
          d="M 10 38 Q 14 22, 24 24 Q 34 26, 38 10"
          stroke="#60A5FA"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="38" cy="10" r="2.5" fill="#60A5FA" />
        
        {/* Innermost line (vibrant green) - starts with dot, ends with arrowhead */}
        <circle cx="12" cy="36" r="2.5" fill="#10B981" />
        <path
          d="M 12 36 Q 16 24, 24 26 Q 32 28, 36 12"
          stroke="#10B981"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Arrowhead pointing up and right */}
        <path
          d="M 36 12 L 40 8 M 36 12 L 38 10"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points="36,12 40,8 38,10"
          fill="#10B981"
        />
      </svg>
      
      {/* Text */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider leading-tight">
          SIGNAL
        </span>
        <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider leading-tight -mt-0.5">
          INTELLIGENCE
        </span>
      </div>
    </div>
  );
}

