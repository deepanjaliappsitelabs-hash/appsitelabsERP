import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

function ForgotPassword() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] p-6">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-950">
          Forgot Password
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your email and the HR team will help reset access.
        </p>
        <form className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="admin@appsitelabs.com"
          />
          <Button
            type="button"
            className="w-full"
          >
            Send Reset Link
          </Button>
        </form>
        <Link
          to="/"
          className="mt-5 block text-center text-sm font-semibold text-[#5B3FD6]"
        >
          Back to login
        </Link>
      </Card>
    </div>
  );
}

export default ForgotPassword;
