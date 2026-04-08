import { BarChart3, ChevronUp, ChevronDown } from 'lucide-react';
import type { Task } from '@/types';
import { getCategoryStats, getMonthlyTrends, getProgressColor } from '@/utils/tasks';

interface StatsSummaryProps {
  totalCount: number;
  completedCount: number;
  streak: number;
  allTasks: Task[];
  expanded: boolean;
  onToggle: () => void;
}

const StatsSummary = ({ totalCount, completedCount, streak, allTasks, expanded, onToggle }: StatsSummaryProps) => {
  return (
    <div>
      <button
        onClick={onToggle}
        className="pressable flex items-center gap-2 mx-auto text-xs font-medium"
        style={{ color: 'var(--text-muted)' }}
      >
        <BarChart3 size={14} />
        <span className="uppercase tracking-wider">Stats</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <div className="expand-content" style={{ maxHeight: expanded ? '600px' : '0px', opacity: expanded ? 1 : 0 }}>
        <div className="pt-3 space-y-4">
          {/* Mini stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Tasks', value: totalCount },
              { label: 'Done', value: completedCount },
              { label: 'Streak', value: `${streak}d` },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl p-3 text-center"
                style={{ background: 'var(--bg-card-60)', border: '1px solid var(--border-input)' }}
              >
                <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{card.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>By Category</h4>
            <div className="space-y-2">
              {Object.entries(getCategoryStats(allTasks)).map(([cat, stats]) => (
                stats.total > 0 && (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                        <div className="h-full rounded-full" style={{ width: `${stats.avgProgress}%`, background: getProgressColor(stats.avgProgress) }} />
                      </div>
                      <span className="text-xs font-medium w-8 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>{stats.avgProgress}%</span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Monthly trends */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Monthly Trends</h4>
            <div className="flex items-end gap-1 h-16">
              {getMonthlyTrends(allTasks).map((trend) => (
                <div key={`${trend.month}-${trend.year}`} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${Math.max(4, (trend.avgProgress / 100) * 48)}px`,
                      background: trend.avgProgress > 0 ? 'var(--accent)' : 'var(--divider)',
                      opacity: trend.avgProgress > 0 ? 0.7 : 0.3,
                    }}
                  />
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{trend.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSummary;
