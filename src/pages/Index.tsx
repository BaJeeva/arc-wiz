import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Zap, Shield, Layers, Check } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { openCheckout, plan } = useSubscription();

  const handlePricingClick = async (priceId: string, planName: string) => {
    try {
      await openCheckout(priceId);
      toast.success(`Opening checkout for ${planName} plan`);
    } catch (error) {
      toast.error("Please sign in first to subscribe");
      navigate("/auth");
    }
  };

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying out DiagramAI",
      features: [
        "50 diagrams per hour",
        "All diagram styles",
        "Basic export options",
        "7-day history",
      ],
      cta: "Get Started",
      onClick: () => navigate("/auth"),
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$9.90",
      priceId: "price_1SDuIG52ySA6lezKSi8o7c2O",
      description: "For professionals and small teams",
      features: [
        "Unlimited diagrams",
        "Priority AI processing",
        "Advanced export (PDF, SVG)",
        "Unlimited history",
        "Priority support",
        "Custom templates",
      ],
      cta: "Upgrade to Pro",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "$20.00",
      priceId: "price_1SDuIT52ySA6lezK89TpMuI4",
      description: "For large teams and organizations",
      features: [
        "Everything in Pro",
        "Team collaboration",
        "Custom branding",
        "Dedicated support",
        "SLA guarantee",
        "Advanced security",
      ],
      cta: "Upgrade to Enterprise",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAxMmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDBjMy4zMTQgMCA2IDIuNjg2IDYgNnMtMi42ODYgNi02IDYtNi0yLjY4Ni02LTYgMi42ODYtNiA2LTZ6IiBzdHJva2U9ImhzbCgyNjIgODMlIDU4JSAvIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L2c+PC9zdmc+')] opacity-40"></div>
        
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
              <Sparkles className="w-4 h-4" />
              AI-Powered Diagram Generation
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Create Diagrams
              </span>
              <br />
              with Natural Language
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your ideas into professional architecture diagrams instantly. 
              Just describe what you want, and let AI do the rest.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                variant="hero"
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl bg-card border border-border/50 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-primary)] transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-[var(--shadow-primary)] group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Generate complex diagrams in seconds. No more manual drawing or complex tools.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-card border border-border/50 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-primary)] transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-[var(--shadow-primary)] group-hover:scale-110 transition-transform">
                <Layers className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Multiple Styles</h3>
              <p className="text-muted-foreground">
                Choose from colored, hand-drawn, or AWS icon styles to match your needs.
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-card border border-border/50 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-primary)] transition-all">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-[var(--shadow-primary)] group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your diagrams are stored securely with user authentication and data protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border border-primary/20">
          <h2 className="text-4xl md:text-5xl font-bold">
            Choose Your Plan
          </h2>
          <p className="text-xl text-muted-foreground">
            Start free, upgrade when you need more power
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-primary)] transition-all ${
                plan.highlighted ? "border-2 border-primary scale-105" : "border-border/50"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "$0" && <span className="text-muted-foreground">/month</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full"
                  onClick={() =>
                    plan.priceId
                      ? handlePricingClick(plan.priceId, plan.name)
                      : plan.onClick?.()
                  }
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Start Creating Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;