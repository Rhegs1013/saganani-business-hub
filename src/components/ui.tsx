import { clsx } from "clsx";
import Link from "next/link";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-extrabold text-2xl sm:text-3xl text-sibol-green">{title}</h1>
        {subtitle ? <p className="mt-1 text-sibol-green/70">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-2xl border border-sibol-green/10 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "outline" | "danger" | "ghost";
  size?: "md" | "sm";
}) {
  return (
    <button
      className={clsx(
        "tap-target inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none",
        size === "md" ? "px-5 py-2.5 text-base" : "px-3.5 py-2 text-sm",
        variant === "primary" && "bg-sibol-green text-bigas-cream hover:bg-sibol-green/90",
        variant === "accent" && "bg-butil-gold text-sibol-green hover:bg-butil-gold/90",
        variant === "outline" && "border-2 border-sibol-green text-sibol-green hover:bg-sibol-green/5",
        variant === "danger" && "bg-lupang-sunog text-bigas-cream hover:bg-lupang-sunog/90",
        variant === "ghost" && "text-sibol-green hover:bg-sibol-green/5",
        className,
      )}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  className,
  variant = "primary",
  size = "md",
  children,
}: {
  href: string;
  className?: string;
  variant?: "primary" | "accent" | "outline" | "ghost";
  size?: "md" | "sm";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "tap-target inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors",
        size === "md" ? "px-5 py-2.5 text-base" : "px-3.5 py-2 text-sm",
        variant === "primary" && "bg-sibol-green text-bigas-cream hover:bg-sibol-green/90",
        variant === "accent" && "bg-butil-gold text-sibol-green hover:bg-butil-gold/90",
        variant === "outline" && "border-2 border-sibol-green text-sibol-green hover:bg-sibol-green/5",
        variant === "ghost" && "text-sibol-green hover:bg-sibol-green/5",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-bold text-sm text-sibol-green">
        {label}
        {required ? <span className="text-lupang-sunog"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-sibol-green/60">{hint}</p> : null}
    </div>
  );
}

const controlClasses =
  "tap-target w-full rounded-xl border border-sibol-green/20 bg-white px-3.5 py-2.5 text-base text-sibol-green outline-none focus:border-butil-gold focus:ring-2 focus:ring-butil-gold/40";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(controlClasses, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(controlClasses, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(controlClasses, "min-h-24", props.className)} />;
}

const badgeTones: Record<string, string> = {
  green: "bg-sibol-green/10 text-sibol-green",
  gold: "bg-butil-gold/20 text-sibol-green",
  red: "bg-lupang-sunog/10 text-lupang-sunog",
  gray: "bg-sibol-green/5 text-sibol-green/60",
};

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: ReactNode;
  tone?: "green" | "gold" | "red" | "gray";
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): "green" | "gold" | "red" | "gray" {
  if (["Completed", "Paid", "Verified", "Converted to Order"].includes(status)) return "green";
  if (["Cancelled", "Not interested"].includes(status)) return "red";
  if (["New", "Not Started", "Unverified"].includes(status)) return "gray";
  return "gold";
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sibol-green/20 bg-white/60 px-6 py-12 text-center">
      <p className="font-extrabold text-lg text-sibol-green">{title}</p>
      {description ? <p className="max-w-sm text-sm text-sibol-green/60">{description}</p> : null}
      {action}
    </div>
  );
}

export function TableScroll({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-2xl border border-sibol-green/10 bg-white shadow-sm">{children}</div>;
}
