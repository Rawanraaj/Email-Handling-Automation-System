import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, BarChart3 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

const CATEGORY_COLORS = {
  Work: "#3b82f6",
  Personal: "#a855f7",
  Promotions: "#f59e0b",
  Urgent: "#ef4444",
  Other: "#6b7280",
};

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = trpc.analytics.getStats.useQuery();
  const topSenders = stats?.topSenders || [];
  const categoryDist = stats?.categoryCounts || {};
  const topSendersLoading = statsLoading;
  const categoryLoading = statsLoading;

  const categoryData = categoryDist
    ? Object.entries(categoryDist).map(([name, value]) => ({
        name,
        value,
        fill: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS],
      }))
    : [];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Email insights and statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Emails</p>
                <p className="text-3xl font-bold mt-2">{categoryDist ? Object.values(categoryDist).reduce((a: number, b: any) => a + b, 0) : 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Senders</p>
                <p className="text-3xl font-bold mt-2">{topSenders?.length || 0}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent Emails</p>
                <p className="text-3xl font-bold mt-2">{categoryDist?.Urgent || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Email Categories</h3>
            {categoryLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Top Senders */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Senders</h3>
            {topSendersLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : topSenders && topSenders.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSenders}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No data available</p>
              </div>
            )}
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {categoryData.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.fill }} />
                  <span className="font-medium">{category.name}</span>
                </div>
                <span className="text-muted-foreground">{category.value} emails</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
