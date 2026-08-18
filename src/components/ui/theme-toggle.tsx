import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
	const [theme, setTheme] = useState<"light" | "dark">("light");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		const savedTheme = localStorage.getItem("sarpras-theme") as
			| "light"
			| "dark"
			| null;
		if (savedTheme) {
			setTheme(savedTheme);
			if (savedTheme === "dark") {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
		} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
			setTheme("dark");
			document.documentElement.classList.add("dark");
		}
	}, []);

	const toggleTheme = () => {
		const newTheme = theme === "dark" ? "light" : "dark";
		setTheme(newTheme);
		localStorage.setItem("sarpras-theme", newTheme);
		if (newTheme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	};

	if (!mounted) {
		return (
			<button
				type="button"
				className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted ${className}`}
				aria-label="Toggle Theme"
			>
				<span className="h-4 w-4" />
			</button>
		);
	}

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-all hover:bg-muted hover:text-foreground cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-primary/40 ${className}`}
			aria-label={
				theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"
			}
			title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
		>
			{theme === "dark" ? (
				<Sun className="h-4 w-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
			) : (
				<Moon className="h-4 w-4 text-sky-600 transition-transform rotate-0 hover:-rotate-12" />
			)}
		</button>
	);
}
