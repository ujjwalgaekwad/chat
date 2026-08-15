import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useLogin } from "../hooks/useAuth";
import { extractErrorMessage } from "../lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await login.mutateAsync(values);
      navigate("/app", { replace: true });
    } catch (err) {
      setServerError(extractErrorMessage(err, "Couldn't sign you in"));
    }
  };

  return (
    <AuthShell>
      <h1 className="font-display text-3xl text-ink-900 dark:text-ink-50">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">Sign in to keep the conversation going.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            className="input"
            {...register("email")}
          />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            className="input"
            {...register("password")}
          />
        </Field>

        {serverError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {serverError}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
        New here?{" "}
        <Link to="/register" className="font-medium text-pine-600 hover:underline dark:text-pine-400">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 dark:bg-ink-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine-500 font-display text-lg text-white">
            C
          </span>
          <span className="font-display text-lg text-ink-900 dark:text-ink-50">Current</span>
        </div>
        <div className="rounded-2xl border border-ink-200 bg-white p-8 shadow-panel dark:border-ink-800 dark:bg-ink-900">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">{label}</span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </label>
  );
}
