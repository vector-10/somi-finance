"use client"
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ArrowRight, Users, Shield, TrendingUp, Star, Coins, Target, Clock, Menu, X, Wallet, Lock } from 'lucide-react';

export default function SomiFinanceLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-reveal');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen text-white bg-[radial-gradient(60%_60%_at_50%_-10%,rgba(107,70,193,0.25),transparent),radial-gradient(40%_30%_at_100%_10%,rgba(59,130,246,0.18),transparent)]">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]" />

      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="group inline-flex items-center">
            <Image 
            src="/somi.png"
            width={150}
            height={150}
            alt="somi finance logo"
            />
            <span className="bg-gradient-to-r from-purple-400 via-blue-300 to-indigo-200 bg-clip-text text-lg font-bold tracking-tight text-transparent group-hover:opacity-90">Somi Finance</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#testimonials" className="hover:text-white">Testimonials</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden md:flex items-center rounded-sm bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300">Launch App <ArrowRight className="h-4 w-4 font-bold" /></Link>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-sm"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`fixed top-0 right-0 h-full w-80 bg-slate-950 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <span className="bg-gradient-to-r from-purple-400 via-blue-300 to-indigo-200 bg-clip-text font-bold tracking-tight text-transparent">Menu</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-white hover:bg-white/10 rounded-sm transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex flex-col h-full">
          <div className="space-y-6 flex-1">
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 text-white/80 hover:text-white border-b border-white/10 transition-colors">Features</a>
            <a href="#how" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 text-white/80 hover:text-white border-b border-white/10 transition-colors">How it works</a>
            <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 text-white/80 hover:text-white border-b border-white/10 transition-colors">Testimonials</a>
          </div>

          <div className="mt-auto pt-6 border-t border-white/10">
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 rounded-sm bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition-colors">
              Launch App <ArrowRight className="h-4 w-4" />
            </Link>
            
            <div className="pt-4 text-center">
              <p className="text-sm text-white/60">
                Built for Somnia Ecosystem
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="relative mx-auto max-w-5xl px-4 pt-32 pb-20 text-center">
        <div className="space-y-8 scroll-reveal">
          <span className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90">
            <Wallet className="h-4 w-4" /> Built for Somnia Testnet
          </span>
          
          <h1 className="text-balance text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
            The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300">Social Savings</span>
          </h1>
          
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl">
            Join friends in savings pods to earn up to 50% APY. Built for the next generation 
            of DeFi users on Somnia's lightning-fast blockchain.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-sm bg-purple-600 px-6 py-4 text-sm font-semibold text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all">
              Start Saving <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="rounded-sm border border-white/20 bg-white/5 px-6 py-4 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all">View Demo</a>
          </div>
          
          <div className="flex flex-wrap justify-center font-bold gap-8 pt-6 text-white/70">
            <div className="flex items-center gap-2"><Shield className="h-4 w-4"/> Enterprise Security</div>
            <div className="flex items-center gap-2"><Lock className="h-4 w-4"/> Self-custody</div>
            {/* <div className="flex items-center gap-2"><Chart className="h-4 w-4"/> Transparent APY</div> */}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20 md:mt-[6rem]">
        <div className="mb-10 flex items-end justify-between scroll-reveal">
          <h2 className="text-2xl font-bold md:text-3xl">Why Choose Somi Finance?</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {icon: <Users className="h-5 w-5"/>, title: "Savings Pods", desc: "Pool resources with 3-5 friends to unlock higher yields and boost engagement"},
            {icon: <Coins className="h-5 w-5"/>, title: "NFT Rewards", desc: "Earn Bronze, Silver, and Gold receipt NFTs that upgrade based on your participation"},
            {icon: <TrendingUp className="h-5 w-5"/>, title: "High Yields", desc: "Earn up to 50% APY on 2-year fixed deposits with competitive rates across all plans"},
            {icon: <Target className="h-5 w-5"/>, title: "Flexible Plans", desc: "Choose from Flex Save, custom durations, or fixed terms to match your goals"},
            {icon: <Clock className="h-5 w-5"/>, title: "Instant Transactions", desc: "Built on Somnia for sub-second finality and minimal transaction costs"},
            {icon: <Shield className="h-5 w-5"/>, title: "Battle-Tested Security", desc: "Smart contracts with reentrancy protection, access controls, and comprehensive testing"}
          ].map((f, i) => (
            <div key={i} className="h-full rounded-sm border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:bg-white/10 scroll-reveal">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-sm bg-white/10">{f.icon}</div>
              <div className="text-lg font-semibold">{f.title}</div>
              <p className="text-white/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-4 pb-20 md:mt-[6rem]">
        <h2 className="mb-8 text-2xl font-bold md:text-3xl scroll-reveal">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {s:"1", h:"Connect & Select", d:"Connect wallet and choose your savings plan (Solo or Pods)."},
            {s:"2", h:"Deposit & Earn", d:"Deposit STT tokens and start earning yields immediately."},
            {s:"3", h:"Withdraw Anytime", d:"Redeem your principal + interest with flexible withdrawal options."},
          ].map((x) => (
            <div key={x.s} className="relative rounded-sm border border-white/10 bg-white/5 p-6 scroll-reveal">
              <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-600 text-sm font-bold">{x.s}</div>
              <div className="text-lg font-semibold">{x.h}</div>
              <p className="text-white/70">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="testimonials" className="px-4 py-16 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 scroll-reveal">
            What Users Say
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-sm p-6 backdrop-blur transform rotate-1 scroll-reveal">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-white/70 mb-4">
                "Finally, a DeFi platform that's actually easy to use. Made my first $500 in pods with friends!"
              </p>
              <div className="font-medium">Alex Chen</div>
              <div className="text-sm text-white/60">Early Adopter</div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-sm p-6 backdrop-blur transform -rotate-1 scroll-reveal">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-white/70 mb-4">
                "The group savings feature got our entire Discord server saving together. Love the social aspect!"
              </p>
              <div className="font-medium">Maria Santos</div>
              <div className="text-sm text-white/60">Pod Creator</div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-sm p-6 backdrop-blur transform rotate-2 scroll-reveal">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-white/70 mb-4">
                "Clean interface, solid yields, and actually works as promised. This is what DeFi should be."
              </p>
              <div className="font-medium">David Kim</div>
              <div className="text-sm text-white/60">DeFi Veteran</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24">
        <div className="overflow-hidden rounded-sm border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-white/5 p-8 text-center shadow-lg scroll-reveal">
          <h3 className="text-balance text-2xl font-bold md:text-3xl">Ready to Start Your Savings Journey?</h3>
          <p className="mx-auto mt-2 max-w-2xl text-white/80">Join the future of decentralized savings. No complex setup, no hidden fees.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-sm bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300">
              Launch Somi Finance <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="rounded-sm border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20">View Features</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-white/70 md:flex-row">
          <div className="text-sm">© {new Date().getFullYear()} Somi Finance. Built on Somnia Blockchain.</div>
          <div className="flex items-center gap-5 text-sm">
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Docs</a>
            <a href="#" className="hover:text-white">Support</a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease-out;
        }
        
        .scroll-reveal.animate-reveal {
          opacity: 1;
          transform: translateY(0);
        }
        
        .scroll-reveal:nth-child(even) {
          transition-delay: 0.1s;
        }
        
        .scroll-reveal:nth-child(3n) {
          transition-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}