import Link from "next/link";

const Icon = {
  ArrowRight: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={props.className}>
      <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
  ),
  Shield: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={props.className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  Chart: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={props.className}>
      <path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12" y="8" width="3" height="10" rx="1"/><rect x="17" y="5" width="3" height="13" rx="1"/></svg>
  ),
  Lock: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={props.className}>
      <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  Wallet: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={props.className}>
      <path d="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/><path d="M16 11h4"/><path d="M3 7V5a2 2 0 0 1 2-2h10"/></svg>
  ),
};

export default function SomiFinanceLanding() {
  return (
    <div className="relative min-h-screen text-white bg-[radial-gradient(60%_60%_at_50%_-10%,rgba(107,70,193,0.25),transparent),radial-gradient(40%_30%_at_100%_10%,rgba(59,130,246,0.18),transparent)]">
      {/* Grid overlay */}
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]" />

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="group inline-flex items-center gap-2">
            <span className="h-7 w-7 rounded-md bg-gradient-to-br from-purple-500 to-indigo-700 shadow-md shadow-purple-500/30" />
            <span className="bg-gradient-to-r from-purple-400 via-blue-300 to-indigo-200 bg-clip-text text-lg font-bold tracking-tight text-transparent group-hover:opacity-90">Somi Finance</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/app" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300">App</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pt-16 md:pt-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90">
              <Icon.Wallet className="h-4 w-4" /> Built for Somnia Testnet
            </span>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight md:text-6xl">
              Save. Earn. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-300 to-indigo-200">Stay Liquid.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-white/80">
              Somi Finance is a non-custodial savings layer on Somnia. Deposit tokens, earn on-chain yield, and keep full control of your assets.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/app" className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300">
                Launch App <Icon.ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20">Explore Features</a>
            </div>
            <div className="flex items-center gap-6 pt-2 text-white/70">
              <div className="flex items-center gap-2"><Icon.Shield className="h-4 w-4"/> Open-source</div>
              <div className="flex items-center gap-2"><Icon.Lock className="h-4 w-4"/> Self-custody</div>
              <div className="flex items-center gap-2"><Icon.Chart className="h-4 w-4"/> Transparent APY</div>
            </div>
          </div>

          {/* Metric preview card */}
          <div className="relative">
            <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="mb-4 flex items-center gap-2 text-white/80">
                <Icon.Wallet className="h-5 w-5" /> <span>Protocol Snapshot</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-white">
                <div className="rounded-md border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-white/70">Total Supply</div>
                  <div className="text-2xl font-semibold">1,000,000 mUSDC</div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-white/70">APY (demo)</div>
                  <div className="text-2xl font-semibold">5.0%</div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-white/70">Depositors</div>
                  <div className="text-2xl font-semibold">2,481</div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-white/70">Network</div>
                  <div className="text-2xl font-semibold">Somnia</div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -inset-10 -z-10 blur-3xl [background:radial-gradient(100px_80px_at_70%_20%,rgba(147,102,255,0.35),transparent),radial-gradient(160px_140px_at_20%_60%,rgba(99,102,241,0.25),transparent)]"/>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">Why Somi Finance</h2>
          <a href="/docs" className="text-sm text-purple-300 hover:text-purple-200">Read the docs →</a>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[{icon:<Icon.Chart className="h-5 w-5"/>,t:"Real-time yield",d:"Transparent accounting and share-based accruals."},
            {icon:<Icon.Shield className="h-5 w-5"/>,t:"Open-source contracts",d:"Verifiable Solidity with public addresses."},
            {icon:<Icon.Lock className="h-5 w-5"/>,t:"Self-custody",d:"You keep the keys. Deposit/withdraw anytime."},
            {icon:<Icon.Wallet className="h-5 w-5"/>,t:"Fast settlement",d:"Somnia RPC keeps interactions snappy."},
            {icon:<Icon.Chart className="h-5 w-5"/>,t:"Composability",d:"ERC-20 shares and clean interfaces."},
            {icon:<Icon.ArrowRight className="h-5 w-5"/>,t:"Simple UX",d:"Deposit, track, withdraw—no noise."}]
            .map((f, i) => (
              <div key={i} className="h-full rounded-md border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:bg-white/10">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/10">{f.icon}</div>
                <div className="text-lg font-semibold">{f.t}</div>
                <p className="text-white/70">{f.d}</p>
              </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 pb-20">
        <h2 className="mb-8 text-2xl font-bold md:text-3xl">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {s:"1", h:"Connect & Select", d:"Connect wallet and choose a token (e.g., mUSDC)."},
            {s:"2", h:"Deposit & Earn", d:"Deposit to receive shares. Yield accrues to the pool."},
            {s:"3", h:"Withdraw Anytime", d:"Redeem shares for principal + yield in one tx."},
          ].map((x) => (
            <div key={x.s} className="relative rounded-md border border-white/10 bg-white/5 p-6">
              <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-sm font-bold">{x.s}</div>
              <div className="text-lg font-semibold">{x.h}</div>
              <p className="text-white/70">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-white/5 p-8 text-center shadow-lg">
          <h3 className="text-balance text-2xl font-bold md:text-3xl">Ready to try Somi Finance on Somnia?</h3>
          <p className="mx-auto mt-2 max-w-2xl text-white/80">Launch the app, deposit test tokens, and see real-time on-chain state.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/app" className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300">
              Open App <Icon.ArrowRight className="h-4 w-4" />
            </Link>
            <a href="/docs" className="rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20">Read Docs</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-white/70 md:flex-row">
          <div className="text-sm">© {new Date().getFullYear()} Somi Finance — Testnet Prototype</div>
          <div className="flex items-center gap-5 text-sm">
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Twitter</a>
            <a href="#" className="hover:text-white">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}