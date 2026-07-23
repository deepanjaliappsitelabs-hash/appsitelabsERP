import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "../ui/Card";

const defaultData = [
  { month: "Jan", revenue: 18 },
  { month: "Feb", revenue: 22 },
  { month: "Mar", revenue: 19 },
  { month: "Apr", revenue: 26 },
  { month: "May", revenue: 31 },
  { month: "Jun", revenue: 28 },
];

function RevenueChart({ data = defaultData }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-slate-950">
        Revenue Overview
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F6" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip
            contentStyle={{ borderColor: "#E7E8F0", borderRadius: 12 }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#302568"
            strokeWidth={3}
            dot={{ fill: "#7560A7", strokeWidth: 2, r: 4 }}
            activeDot={{ fill: "#302568", r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default RevenueChart;