import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { getLoginUrl } from "@/const";

/**
 * Azlor Login Page
 * Enterprise-grade security with OAuth 2.0 via Manus
 */
export default function Login() {
  const loginUrl = getLoginUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-white mb-2">Azlor</div>
          <p className="text-blue-200">Professional Email Automation</p>
        </div>

        {/* Main Card */}
        <Card className="p-8 bg-white/95 backdrop-blur-sm shadow-2xl">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-gray-600">Sign in to your Azlor account</p>
            </div>

            {/* Security Features */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-gray-900">Enterprise Security</p>
                  <p className="text-xs text-gray-600">OAuth 2.0 with secure session management</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-gray-900">End-to-End Encryption</p>
                  <p className="text-xs text-gray-600">HTTPS/TLS 1.3 with AES-256 encryption</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-gray-900">2FA Support</p>
                  <p className="text-xs text-gray-600">Two-factor authentication available</p>
                </div>
              </div>
            </div>

            {/* OAuth Login */}
            <div className="space-y-4">
              <Button
                asChild
                size="lg"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white"
              >
                <a href={loginUrl}>
                  Sign In with Manus OAuth
                </a>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to Azlor?</span>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full"
              >
                <a href={`${loginUrl}?signup=true`}>
                  Create Account
                </a>
              </Button>
            </div>

            {/* Security Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Your password is never stored on Azlor servers. We use OAuth 2.0 for secure authentication.
                </p>
              </div>
            </div>

            {/* Links */}
            <div className="text-center space-y-2 text-sm">
              <div className="flex justify-center gap-4">
                <a href="/privacy" className="text-blue-600 hover:text-blue-700">
                  Privacy Policy
                </a>
                <span className="text-gray-300">•</span>
                <a href="/terms" className="text-blue-600 hover:text-blue-700">
                  Terms of Service
                </a>
              </div>
              <p className="text-gray-600">
                Need help? <a href="mailto:support@azlor.com" className="text-blue-600 hover:text-blue-700">Contact Support</a>
              </p>
            </div>
          </div>
        </Card>

        {/* Security Badges */}
        <div className="mt-6 flex justify-center gap-4 text-xs text-white/80">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>SSL Encrypted</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>SOC 2 Compliant</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>GDPR Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
