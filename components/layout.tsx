import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const buttonVariants = {
  default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
  outline:
    "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
  secondary:
    "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4">
        <nav className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            RMS
          </Link>
          <div className="space-x-4">
            <Button
              variant="ghost"
              className={cn(buttonVariants.ghost, "text-primary-foreground")}
              asChild
            >
              <Link href="/employees">Employees</Link>
            </Button>
            <Button
              variant="ghost"
              className={cn(buttonVariants.ghost, "text-primary-foreground")}
              asChild
            >
              <Link href="/projects">Projects</Link>
            </Button>
            <Button
              variant="ghost"
              className={cn(buttonVariants.ghost, "text-primary-foreground")}
              asChild
            >
              <Link href="/assign">Assign</Link>
            </Button>
            <Button
              variant="ghost"
              className={cn(buttonVariants.ghost, "text-primary-foreground")}
              asChild
            >
              <Link href="/utilization">Utilization</Link>
            </Button>
          </div>
        </nav>
      </header>
      <main className="flex-grow container mx-auto p-4">{children}</main>
      <footer className="bg-gray-100 p-4 text-center">
        <p>&copy; 2023 Resource Management System</p>
      </footer>
    </div>
  );
}
