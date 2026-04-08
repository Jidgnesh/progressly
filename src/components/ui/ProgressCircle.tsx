import { getProgressColor } from '@/utils/tasks';

interface ProgressCircleProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
}

const ProgressCircle = ({ progress, size = 40, strokeWidth = 4, animate = false }: ProgressCircleProps) => {
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = radius * 2 * Math.PI;
  const fillLength = (progress / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" style={{ width: size, height: size }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--divider)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getProgressColor(progress)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${fillLength} ${circumference}`}
          strokeLinecap="round"
          className={animate ? 'progress-ring-circle' : ''}
        />
      </svg>
    </div>
  );
};

export default ProgressCircle;
