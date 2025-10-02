import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, FileText, Share2 } from "lucide-react";

export const Onboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("has-seen-onboarding");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("has-seen-onboarding", "true");
    setShowOnboarding(false);
    setStep(0);
  };

  const steps = [
    {
      icon: Sparkles,
      title: "Welcome to DiagramAI!",
      description: "Create professional architecture diagrams using natural language. Let's show you around.",
    },
    {
      icon: FileText,
      title: "Describe Your Architecture",
      description: "Simply type what you want to create - like 'microservices with API gateway' - and choose a style.",
    },
    {
      icon: Zap,
      title: "Generate Instantly",
      description: "Click generate and watch AI create your diagram in seconds. Use real-time preview for instant feedback.",
    },
    {
      icon: Share2,
      title: "Export & Share",
      description: "Download as PNG/PDF or create shareable links. Your diagrams are automatically saved to history.",
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 mx-auto shadow-[var(--shadow-primary)]">
            <Icon className="w-8 h-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-2xl">{currentStep.title}</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-2 my-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === step ? "w-8 bg-primary" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {step < steps.length - 1 ? (
            <>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Skip
              </Button>
              <Button onClick={() => setStep(step + 1)} className="flex-1">
                Next
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Get Started
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
