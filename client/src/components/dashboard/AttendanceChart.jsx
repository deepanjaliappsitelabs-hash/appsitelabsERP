import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Card from "../ui/Card";

const data = [
  { day: "Mon", attendance: 80 },
  { day: "Tue", attendance: 90 },
  { day: "Wed", attendance: 70 },
  { day: "Thu", attendance: 95 },
  { day: "Fri", attendance: 85 },
];

function AttendanceChart() {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-slate-950">
        Attendance Analytics
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip
            cursor={{ fill: "#EDE8F5" }}
            contentStyle={{ borderColor: "#E7E8F0", borderRadius: 12 }}
          />
          <Bar
            dataKey="attendance"
            fill="#302568"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default AttendanceChart;