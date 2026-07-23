import {
  FaCalendarCheck,
  FaCalendarMinus,
  FaClock,
  FaUmbrellaBeach,
} from "react-icons/fa";
import StatsCard from "../ui/StatsCard";

function AttendanceStats({
  presentToday = 0,
  absent = 0,
  late = 0,
  onLeave = 0,
}) {
  return (
    <div className="grid grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Present Today"
        value={presentToday}
        icon={<FaCalendarCheck />}
      />

      <StatsCard
        title="Absent"
        value={absent}
        icon={<FaCalendarMinus />}
      />

      <StatsCard
        title="Late"
        value={late}
        icon={<FaClock />}
      />

      <StatsCard
        title="On Leave"
        value={onLeave}
        icon={<FaUmbrellaBeach />}
      />
    </div>
  );
}

export default AttendanceStats;
