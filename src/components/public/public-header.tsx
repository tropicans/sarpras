import { Link } from "@tanstack/react-router";
import {
	Building2,
	CalendarSearch,
	LogIn,
	Menu,
	Search,
	ShieldCheck,
	X,
} from "lucide-react";
import { useState } from "react";

export function PublicHeader() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md transition-all">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Logo / Brand */}
				<Link to="/" className="flex items-center gap-3 group">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
						<Building2 className="h-5 w-5" />
					</div>
					<div>
						<div className="flex items-center gap-1.5 font-bold text-lg leading-tight tracking-tight text-foreground">
							<span>Sarpras PPKASN</span>
							<span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
								KEMENKES
							</span>
						</div>
						<p className="text-xs text-muted-foreground">
							Layanan Peminjaman Sarana & Prasarana
						</p>
					</div>
				</Link>

				{/* Desktop Navigation */}
				<nav className="hidden md:flex items-center gap-1">
					<Link
						to="/"
						className="px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-lg hover:bg-muted"
					>
						Beranda
					</Link>
					<a
						href="/#katalog"
						className="px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-lg hover:bg-muted"
					>
						Katalog Sarana
					</a>
					<Link
						to="/status"
						className="px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-lg hover:bg-muted flex items-center gap-1.5"
					>
						<Search className="h-4 w-4" />
						Cek Status
					</Link>
				</nav>

				{/* Action Buttons */}
				<div className="hidden md:flex items-center gap-3">
					<Link
						to="/login"
						className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-xs hover:bg-muted transition-colors"
					>
						<LogIn className="h-4 w-4 text-muted-foreground" />
						Masuk Petugas
					</Link>
				</div>

				{/* Mobile Menu Toggle */}
				<button
					type="button"
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-foreground hover:bg-muted"
					aria-label="Toggle Navigation Menu"
				>
					{mobileMenuOpen ? (
						<X className="h-6 w-6" />
					) : (
						<Menu className="h-6 w-6" />
					)}
				</button>
			</div>

			{/* Mobile Navigation Drawer */}
			{mobileMenuOpen && (
				<div className="md:hidden border-b border-border bg-background px-4 pt-2 pb-6 space-y-2">
					<Link
						to="/"
						onClick={() => setMobileMenuOpen(false)}
						className="block px-3 py-2.5 rounded-lg text-base font-medium text-foreground hover:bg-muted"
					>
						Beranda
					</Link>
					<a
						href="/#katalog"
						onClick={() => setMobileMenuOpen(false)}
						className="block px-3 py-2.5 rounded-lg text-base font-medium text-foreground hover:bg-muted"
					>
						Katalog Sarana
					</a>
					<Link
						to="/status"
						onClick={() => setMobileMenuOpen(false)}
						className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium text-foreground hover:bg-muted"
					>
						<Search className="h-4 w-4" />
						Cek Status Permohonan
					</Link>
					<div className="pt-3 border-t border-border mt-3">
						<Link
							to="/login"
							onClick={() => setMobileMenuOpen(false)}
							className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm"
						>
							<LogIn className="h-4 w-4" />
							Masuk Petugas
						</Link>
					</div>
				</div>
			)}
		</header>
	);
}
