import React, { useMemo, useState } from 'react';
import { LogEntry, ActivityType, Child } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Moon, Baby, Milk, Ruler } from 'lucide-react';

interface AnalyticsProps {
    logs: LogEntry[];
    child: Child;
}

type MetricType = 'sleep' | 'diapers' | 'feeds' | 'growth';
type TimeRange = '1w' | '1m' | '3m';

export const Analytics: React.FC<AnalyticsProps> = ({ logs, child }) => {
    const [metric, setMetric] = useState<MetricType>('sleep');
    const [timeRange, setTimeRange] = useState<TimeRange>('1w');

    const getChartData = () => {
        // 1. Determine date range
        const now = new Date();
        const startDate = new Date();
        let daysToGenerate = 7;
        let groupMode: 'day' | 'week' = 'day';

        if (timeRange === '1w') {
            daysToGenerate = 7;
            startDate.setDate(now.getDate() - 6);
        } else if (timeRange === '1m') {
            daysToGenerate = 30;
            startDate.setDate(now.getDate() - 29);
        } else if (timeRange === '3m') {
            daysToGenerate = 12; // approx 12 weeks
            groupMode = 'week';
            startDate.setDate(now.getDate() - (12 * 7));
        }

        // 2. Define Filters & Extractors
        let typeFilter = (l: LogEntry) => false;
        let valueExtractor = (logs: LogEntry[]) => 0;

        switch (metric) {
            case 'sleep':
                typeFilter = l => l.type === ActivityType.SLEEP;
                valueExtractor = (dayLogs) => Number((dayLogs.reduce((acc, curr) => acc + (curr.value || 0), 0) / 60).toFixed(1));
                break;
            case 'diapers':
                typeFilter = l => l.type === ActivityType.DIAPER;
                valueExtractor = (dayLogs) => dayLogs.length;
                break;
            case 'feeds':
                typeFilter = l => [ActivityType.NURSING, ActivityType.BOTTLE].includes(l.type);
                valueExtractor = (dayLogs) => dayLogs.length;
                break;
            default: break;
        }

        const data = [];

        // 3. Generate Data Points
        if (groupMode === 'day') {
            for (let i = 0; i < daysToGenerate; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                d.setHours(0, 0, 0, 0);

                const nextDay = new Date(d);
                nextDay.setDate(d.getDate() + 1);

                const dayLogs = logs.filter(l => {
                    return l.timestamp >= d.getTime() && l.timestamp < nextDay.getTime() && typeFilter(l);
                });

                data.push({
                    name: d.toLocaleDateString('en-US', {
                        weekday: timeRange === '1w' ? 'short' : undefined,
                        day: timeRange === '1m' ? 'numeric' : undefined,
                        month: timeRange === '1m' ? 'numeric' : undefined
                    }),
                    fullDate: d.toLocaleDateString(),
                    value: valueExtractor(dayLogs)
                });
            }
        } else {
            // Weekly Grouping for 3m
            for (let i = 0; i < daysToGenerate; i++) {
                const weekStart = new Date(startDate);
                weekStart.setDate(startDate.getDate() + (i * 7));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);

                const weekLogs = logs.filter(l => {
                    return l.timestamp >= weekStart.getTime() && l.timestamp < weekEnd.getTime() && typeFilter(l);
                });

                data.push({
                    name: `W${i + 1}`,
                    fullDate: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                    value: valueExtractor(weekLogs)
                });
            }
        }

        return data;
    };

    const chartData = useMemo(() => getChartData(), [logs, metric, timeRange]);

    // Real growth data from logs
    const growthData = useMemo(() => {
        return logs
            .filter(l => l.type === ActivityType.GROWTH && l.value)
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(l => ({
                month: new Date(l.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                weight: l.value,
                standard: 6.0 // This could be improved with a real standard curve based on age
            }));
    }, [logs]);

    const renderMetricButton = (type: MetricType, icon: React.ReactNode, label: string, colorClass: string) => (
        <button
            onClick={() => setMetric(type)}
            className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all border-2 ${metric === type ? colorClass + ' shadow-md scale-105' : 'bg-white border-transparent text-slate-400'}`}
        >
            {icon}
            <span className="text-[10px] font-bold uppercase">{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col h-full px-6 pt-8 pb-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black text-slate-800">Trends</h2>

                {/* Time Range Selector */}
                <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                    {(['1w', '1m', '3m'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${timeRange === range ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {range.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Selector */}
            <div className="flex gap-2 mb-6 bg-slate-100/50 p-2 rounded-3xl">
                {renderMetricButton('sleep', <Moon size={20} />, 'Sleep', 'bg-indigo-100 border-indigo-400 text-indigo-700')}
                {renderMetricButton('feeds', <Milk size={20} />, 'Feeds', 'bg-yellow-100 border-yellow-400 text-yellow-700')}
                {renderMetricButton('diapers', <Baby size={20} />, 'Diapers', 'bg-orange-100 border-orange-400 text-orange-700')}
                {renderMetricButton('growth', <Ruler size={20} />, 'Growth', 'bg-green-100 border-green-400 text-green-700')}
            </div>

            {/* Main Chart */}
            <div className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white/50 mb-6 flex-1 min-h-[350px] flex flex-col">
                <h3 className="font-bold text-slate-700 mb-4 flex justify-between items-center">
                    <span className="capitalize">{metric === 'growth' ? 'Weight Curve' : 'Activity Data'}</span>
                    {metric !== 'growth' && (
                        <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-full border border-slate-100">
                            Avg: {Math.round(chartData.reduce((acc, c) => acc + c.value, 0) / chartData.length)} {metric === 'sleep' ? 'hrs/day' : '/day'}
                        </span>
                    )}
                </h3>

                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        {metric === 'growth' ? (
                            <LineChart data={growthData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[3, 9]} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="standard" stroke="#cbd5e1" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Standard" />
                                <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} name="Baby" />
                            </LineChart>
                        ) : (
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#64748b' }}
                                    interval={timeRange === '1m' ? 4 : 0} // Skip ticks for 1 month view
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [value + (metric === 'sleep' ? 'h' : ''), metric]}
                                    labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                                />
                                <Bar
                                    dataKey="value"
                                    radius={[4, 4, 4, 4]}
                                    barSize={timeRange === '1m' ? 8 : 24}
                                    fill={
                                        metric === 'sleep' ? '#818cf8' :
                                            metric === 'diapers' ? '#fb923c' :
                                                '#facc15'
                                    }
                                />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};
