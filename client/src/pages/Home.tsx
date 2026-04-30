import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Mail, Zap, Brain, BarChart3, Lock, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    navigate("/inbox");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-900">Azlor</span>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Professional Email Automation by
              <span className="bg-gradient-to-r from-blue-700 to-amber-500 bg-clip-text text-transparent"> Azlor</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Intelligent email management that learns your patterns, categorizes automatically, and responds smartly. Experience the future of email productivity.
            </p>
          </div>

          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>Get Started Free</a>
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold">Powerful Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage emails like a professional
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">AI Categorization</h3>
            <p className="text-muted-foreground">
              Automatically categorize emails into Work, Personal, Promotions, and Urgent with intelligent AI analysis.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">Smart Replies</h3>
            <p className="text-muted-foreground">
              Get AI-generated reply suggestions tailored to each email. Respond faster without losing professionalism.
            </p>
          </Card>

          {/* Feature 3 */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold">Priority Inbox</h3>
            <p className="text-muted-foreground">
              AI scoring surfaces the most important emails first. Never miss critical messages again.
            </p>
          </Card>

          {/* Feature 4 */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <Mail className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold">Email Summarization</h3>
            <p className="text-muted-foreground">
              One-click summaries for long email threads. Get the key points instantly.
            </p>
          </Card>

          {/* Feature 5 */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
            <p className="text-muted-foreground">
              Visualize email trends, top senders, and response times. Understand your email patterns.
            </p>
          </Card>

          {/* Feature 6 */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <Lock className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold">Automation Rules</h3>
            <p className="text-muted-foreground">
              Create custom rules to auto-label, archive, or star emails based on your criteria.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="p-12 bg-gradient-to-r from-blue-900 to-blue-700 text-white text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Transform Your Email?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Join thousands of professionals who have reclaimed their inbox with Azlor.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href={getLoginUrl()}>Start Your Free Trial</a>
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-20">
        <div className="container text-center text-muted-foreground">
          <p>&copy; 2026 Azlor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
