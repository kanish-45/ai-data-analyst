import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'

// ── Dummy Data ─────────────────────────────────────────────────

const revenueData = [
  { month: 'Jan', revenue: 42000, expenses: 28000, profit: 14000 },
  { month: 'Feb', revenue: 38000, expenses: 25000, profit: 13000 },
  { month: 'Mar', revenue: 55000, expenses: 31000, profit: 24000 },
  { month: 'Apr', revenue: 48000, expenses: 27000, profit: 21000 },
  { month: 'May', revenue: 63000, expenses: 34000, profit: 29000 },
  { month: 'Jun', revenue: 71000, expenses: 38000, profit: 33000 },
  { month: 'Jul', revenue: 68000, expenses: 36000, profit: 32000 },
  { month: 'Aug', revenue: 79000, expenses: 41000, profit: 38000 },
  { month: 'Sep', revenue: 85000, expenses: 44000, profit: 41000 },
  { month: 'Oct', revenue: 92000, expenses: 47000, profit: 45000 },
  { month: 'Nov', revenue: 98000, expenses: 49000, profit: 49000 },
  { month: 'Dec', revenue: 110000, expenses: 52000, profit: 58000 },
]

const categoryData = [
  { category: 'Electronics', sales: 4200, returns: 320 },
  { category: 'Clothing', sales: 3100, returns: 210 },
  { category: 'Food', sales: 2800, returns: 90 },
  { category: 'Books', sales: 1900, returns: 140 },
  { category: 'Sports', sales: 2400, returns: 180 },
  { category: 'Beauty', sales: 1700, returns: 95 },
]

const pieData = [
  { name: 'North America', value: 42, color: '#22d3ee' },
  { name: 'Europe', value: 28, color: '#a78bfa' },
  { name: 'Asia Pacific', value: 18, color: '#34d399' },
  { name: 'Latin America', value: 8, color: '#fbbf24' },
  { name: 'Others', value: 4, color: '#f87171' },
]

const radarData = [
  { metric: 'Sales', A: 85, B: 62 },
  { metric: 'Marketing', A: 72, B: 80 },
  { metric: 'Support', A: 91, B: 75 },
  { metric: 'Retention', A: 68, B: 88 },
  { metric: 'Growth', A: 79, B: 71 },
  { metric: 'NPS', A: 88, B: 65 },
]

const weeklyData = [
  { day: 'Mon', users: 1200 },
  { day: 'Tue', users: 1900 },
  { day: 'Wed', users: 1600 },
  { day: 'Thu', users: 2100 },
  { day: 'Fri', users: 2800 },
  { day: 'Sat', users: 1800 },
  { day: 'Sun', users: 1100 },
]

// ── Custom Tooltip ──────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass border border-white/10 rounded-xl px-4 py-3 text-sm">
        <p className="text-gray-400 mb-2 font-medium">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-400 capitalize">{entry.name}:</span>
            <span className="text-white font-semibold">
              {typeof entry.value === 'number' && entry.value > 999
                ? '$' + (entry.value / 1000).toFixed(0) + 'k'
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// ── Chart Card Wrapper ──────────────────────────────────────────

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="glass-card rounded-2xl p-6 border border-white/5">
      <div className="mb-6">
        <h3 className="font-bold text-white text-lg">{title}</h3>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────

export default function ChartsSection() {
  return (
    <div className="space-y-6">

      {/* Row 1 — Area Chart (full width) */}
      <ChartCard
        title="Revenue Overview"
        subtitle="Monthly revenue, expenses and profit for 2024"
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => '$' + (v / 1000) + 'k'} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '13px', paddingTop: '16px' }} />
            <Area type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2} fill="url(#colorRevenue)" name="Revenue" />
            <Area type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={2} fill="url(#colorProfit)" name="Profit" />
            <Area type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} fill="url(#colorExpenses)" name="Expenses" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row 2 — Bar Chart + Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <ChartCard
          title="Sales by Category"
          subtitle="Units sold vs returns per category"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="category" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '13px', paddingTop: '12px' }} />
              <Bar dataKey="sales" fill="#22d3ee" radius={[6, 6, 0, 0]} name="Sales" />
              <Bar dataKey="returns" fill="#a78bfa" radius={[6, 6, 0, 0]} name="Returns" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Daily Active Users"
          subtitle="User activity across the week"
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#a78bfa"
                strokeWidth={3}
                dot={{ fill: '#a78bfa', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, fill: '#a78bfa' }}
                name="Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3 — Pie Chart + Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <ChartCard
          title="Revenue by Region"
          subtitle="Geographic distribution of total revenue"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => value + '%'}
                  contentStyle={{
                    background: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="space-y-2 min-w-max">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-gray-400">{entry.name}</span>
                  <span className="text-sm font-semibold text-white ml-auto pl-4">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Performance Radar"
          subtitle="Team A vs Team B across key metrics"
        >
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Radar name="Team A" dataKey="A" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Team B" dataKey="B" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} strokeWidth={2} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '13px', paddingTop: '8px' }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,23,42,0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  )
}