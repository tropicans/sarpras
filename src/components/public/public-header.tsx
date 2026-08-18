import { Link } from "@tanstack/react-router";
import {
	Building2,
	ChevronRight,
	LogIn,
	Menu,
	Search,
	X,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "#/components/ui/theme-toggle";

export function PublicHeader() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md transition-colors">
			<div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Brand / Logo (TanStack & Aside style) */}
				<div className="flex items-center gap-6">
					<Link to="/" className="flex items-center gap-3 group">
						<div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary transition-all group-hover:border-primary group-hover:bg-primary/20">
							<Building2 className="h-4 w-4" />
						</div>
						<div className="flex flex-col">
							<div className="flex items-center gap-2">
								<span className="font-mono text-xs font-bold tracking-wider text-foreground">
									SARPRAS
								</span>
								<span className="text-muted-foreground/60 text-xs font-mono">
									/
								</span>
								<span className="rounded bg-primary/10 border border-primary/20 px-1.5 py-0.2 text-[10px] font-mono font-semibold text-primary">
									PPKASN
								</span>
							</div>
							<span className="text-[10px] text-muted-foreground font-mono hidden sm:inline-block">
								KEMENSETNEG RI
							</span>
						</div>
					</Link>

					{/* Live System Status Pill */}
					<div className="hidden lg:flex items-center gap-2 rounded-full border border-border bg-card/60 px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
						<span className="text-foreground/80 font-medium">SYSTEM:</span>
						<span className="text-emerald-600 dark:text-emerald-400">
							OPERATIONAL
						</span>
					</div>
				</div>

				{/* Desktop Navigation */}
				<nav className="hidden md:flex items-center gap-1">
					<a
						href="/#katalog"
						className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/80"
					>
						Katalog Fasilitas
					</a>
					<a
						href="/#panduan"
						className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/80"
					>
						Alur Peminjaman
					</a>
					<Link
						to="/status"
						className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/80 flex items-center gap-1.5"
						activeProps={{ className: "text-foreground font-semibold bg-muted" }}
					>
						<Search className="h-3.5 w-3.5 text-primary" />
						<span>Cek Status Tiket</span>
					</Link>
				</nav>

				{/* Header Actions */}
				<div className="flex items-center gap-2">
					<ThemeToggle />

					<Link
						to="/login"
						className="hidden sm:inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted hover:border-primary/40 focus:outline-hidden"
					>
						<LogIn className="h-3.5 w-3.5 text-primary" />
						<span>Petugas</span>
					</Link>

					{/* Mobile Menu Toggle */}
					<button
						type="button"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted"
						aria-label="Toggle Navigation Menu"
					>
						{mobileMenuOpen ? (
							<X className="h-4 w-4" />
						) : (
							<Menu className="h-4 w-4" />
						)}
					</button>
				</div>
			</div>

			{/* Mobile Drawer */}
			{mobileMenuOpen && (
				<div className="md:hidden border-b border-border bg-background px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-150">
					<div className="flex items-center justify-between pb-2 border-b border-border/60 text-xs font-mono text-muted-foreground">
						<span>NAVIGATION</span>
						<div className="flex items-center gap-1.5 text-emerald-500">
							<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
							<span>LIVE</span>
						</div>
					</div>
					<a
						href="/#katalog"
						onClick={() => setMobileMenuOpen(false)}
						className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-foreground hover:bg-muted"
					>
						<span>Katalog Fasilitas</span>
						<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
					</a>
					<a
						href="/#panduan"
						onClick={() => setMobileMenuOpen(false)}
						className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-foreground hover:bg-muted"
					>
						<span>Alur Peminjaman</span>
						<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
					</a>
					<Link
						to="/status"
						onClick={() => setMobileMenuOpen(false)}
						className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-foreground hover:bg-muted"
					>
						<span className="flex items-center gap-2">
							<Search className="h-3.5 w-3.5 text-primary" />
							Cek Status Tiket
						</span>
						<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
					</Link>
					<div className="pt-2 border-t border-border mt-2">
						<Link
							to="/login"
							onClick={() => setMobileMenuOpen(false)}
							className="flex items-center justify-center gap-2 w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
						>
							<LogIn className="h-3.5 w-3.5" />
							<span>Masuk Portal Petugas</span>
						</Link>
					</div>
				</div>
			)}
		</header>
	);
}
