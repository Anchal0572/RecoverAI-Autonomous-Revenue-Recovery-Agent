import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Activity, BrainCircuit, BarChart3, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <nav className="h-20 border-b border-border bg-surface/50 backdrop-blur-lg fixed top-0 w-full z-50">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold">⚡</div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">RecoverAI</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Sign In</Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 mt-20">
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Razorpay Integration Live
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              Don't just detect lost revenue. <br className="hidden md:block"/>
              <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">Recover it autonomously.</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              The AI-powered revenue recovery agent that connects to your Razorpay account, analyzes failed payments, and executes intelligent recovery strategies—while you sleep.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="h-12 px-8 text-base">
                  Start Recovering Revenue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="secondary" size="lg" className="h-12 px-8 text-base">
                  View Live Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-surface/30 border-y border-border">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Enterprise-Grade Recovery Engine</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">Stop leaving money on the table. Our AI agents handle the entire recovery lifecycle with precision and guardrails.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-card p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI Root Cause Analysis</h3>
                <p className="text-gray-400 leading-relaxed">Our models instantly analyze failure reasons from the payment gateway to determine the highest probability recovery strategy.</p>
              </div>
              
              <div className="glass-card p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Zap className="w-32 h-32" />
                </div>
                <div className="w-12 h-12 bg-success-bg rounded-xl flex items-center justify-center text-success mb-6">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Autonomous Execution</h3>
                <p className="text-gray-400 leading-relaxed">From smart retries to SMS payment links, the agent executes multi-channel recovery workflows without manual intervention.</p>
              </div>
              
              <div className="glass-card p-8">
                <div className="w-12 h-12 bg-warning-bg rounded-xl flex items-center justify-center text-warning mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Strict Guardrails</h3>
                <p className="text-gray-400 leading-relaxed">Define exactly what the AI can and cannot do. Set maximum retry limits, cooling off periods, and escalation rules.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="glass-card p-12 bg-gradient-to-br from-surface to-background border-primary/20">
              <div className="grid md:grid-cols-4 gap-8 text-center divide-x divide-border">
                <div>
                  <div className="text-4xl font-extrabold text-white mb-2">₹12.4Cr</div>
                  <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Revenue Recovered</div>
                </div>
                <div>
                  <div className="text-4xl font-extrabold text-success mb-2">68%</div>
                  <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Avg Recovery Rate</div>
                </div>
                <div>
                  <div className="text-4xl font-extrabold text-white mb-2 flex items-center justify-center gap-2">
                    <Clock className="w-8 h-8 text-primary" /> 14m
                  </div>
                  <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Time to Recover</div>
                </div>
                <div>
                  <div className="text-4xl font-extrabold text-white mb-2 flex items-center justify-center gap-2">
                    <BarChart3 className="w-8 h-8 text-primary" /> 2.4x
                  </div>
                  <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">ROI Guarantee</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-gray-500 text-sm">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-300">RecoverAI</span> © 2026
          </div>
          <div className="flex gap-6">
            <Link to="/policies" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/policies" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
