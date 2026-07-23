import {
  useEffect,
  useState,
} from "react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

function CheckInCard() {
  const [currentTime, setCurrentTime] =
    useState(new Date());
  const [checkInTime, setCheckInTime] =
    useState(null);
  const [checkOutTime, setCheckOutTime] =
    useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const status = checkInTime
    ? checkOutTime
      ? "Checked Out"
      : "Checked In"
    : "Not Checked In";

  const statusVariant = checkInTime
    ? checkOutTime
      ? "neutral"
      : "success"
    : "warning";

  const workingHours =
    checkInTime && checkOutTime
      ? (
          (checkOutTime - checkInTime) /
          (1000 * 60 * 60)
        ).toFixed(2)
      : checkInTime
        ? (
            (currentTime - checkInTime) /
            (1000 * 60 * 60)
          ).toFixed(2)
        : "0.00";

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Current Time
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {currentTime.toLocaleTimeString()}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {currentTime.toLocaleDateString()}
          </p>
        </div>

        <Badge variant={statusVariant}>
          {status}
        </Badge>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-[#F8F9FC] p-4">
          <p className="text-sm text-slate-500">
            Check-In
          </p>
          <p className="mt-1 font-semibold text-slate-950">
            {checkInTime
              ? checkInTime.toLocaleTimeString()
              : "--"}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8F9FC] p-4">
          <p className="text-sm text-slate-500">
            Check-Out
          </p>
          <p className="mt-1 font-semibold text-slate-950">
            {checkOutTime
              ? checkOutTime.toLocaleTimeString()
              : "--"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-[#F1EDFF] p-4">
        <p className="text-sm font-medium text-[#5B3FD6]">
          Working Hours
        </p>
        <p className="mt-1 text-2xl font-bold text-[#3B2A91]">
          {workingHours} hrs
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          disabled={Boolean(checkInTime)}
          onClick={() =>
            setCheckInTime(new Date())
          }
          className="flex-1 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Check-In
        </Button>

        <Button
          disabled={
            !checkInTime ||
            Boolean(checkOutTime)
          }
          onClick={() =>
            setCheckOutTime(new Date())
          }
          className="flex-1 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Check-Out
        </Button>
      </div>
    </Card>
  );
}

export default CheckInCard;
