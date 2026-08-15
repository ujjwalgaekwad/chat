import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useRegister } from "../hooks/useAuth";
import { extractErrorMessage } from "../lib/api";
import { AuthShell, Field } from "./LoginPage";

const schema = z
  .object({
    name: z.string().min(2, "Enter your name").max(100),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(8, "At least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await registerMutation.mutateAsync(values);
      navigate("/app", { replace: true });
    } catch (err) {
      setServerError(extractErrorMessage(err, "Couldn't create your account"));
    }
  };

  return (
    <AuthShell>
      <h1 className="font-display text-3xl text-ink-900 dark:text-ink-50">Create your account</h1>
      <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">A workspace for your team's real conversations.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Field label="Name" error={errors.name?.message}>
          <input className="input" autoComplete="name" {...register("name")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" className="input" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input type="password" className="input" autoComplete="new-password" {...register("password")} />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <input type="password" className="input" autoComplete="new-password" {...register("confirmPassword")} />
        </Field>

        {serverError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {serverError}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-pine-600 hover:underline dark:text-pine-400">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
