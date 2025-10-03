import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, LogOut, Loader2, History, Crown, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import mermaid from "mermaid";
import { DiagramHistory } from "@/components/DiagramHistory";
import { ExamplePrompts } from "@/components/ExamplePrompts";
import { DiagramExport } from "@/components/DiagramExport";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Generate = () => {
  const navigate = useNavigate();
  const { plan, subscribed, openPortal, openCheckout, refreshSubscription } = useSubscription();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("colored");
  const [loading, setLoading] = useState(false);
  const [diagram, setDiagram] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    mermaid.initialize({ startOnLoad: false, theme: 'default' });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (diagram && mermaidRef.current) {
        try {
          mermaidRef.current.innerHTML = '';
          const { svg } = await mermaid.render('mermaid-diagram', diagram);
          mermaidRef.current.innerHTML = svg;
        } catch (error) {
          console.error('Error rendering diagram:', error);
          toast.error('Failed to render diagram');
        }
      }
    };
    renderDiagram();
  }, [diagram]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const generateDiagramWithPreview = async (isPreview: boolean = false) => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (isPreview) {
      setPreviewLoading(true);
    } else {
      setLoading(true);
      setDiagram(null);
    }

    try {
      const { data, error } = await supabase.functions.invoke("generate-diagram", {
        body: { prompt, style, userId: user?.id },
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes("Rate limit") || data.error.includes("429")) {
          toast.error("Rate limit exceeded. You can make 50 requests per hour. Please try again later.");
        } else if (data.error.includes("Payment required") || data.error.includes("402")) {
          toast.error("Payment required. Please add credits to your workspace.");
        } else {
          toast.error(data.error);
        }
        return;
      }

      setDiagram(data.diagram);
      if (!isPreview) {
        toast.success("Diagram generated!");

        // Save to database only for full generation
        const { data: savedDiagram, error: saveError } = await supabase
          .from("diagrams")
          .insert({
            user_id: user.id,
            prompt,
            style,
            diagram_data: data.diagram,
          })
          .select()
          .single();

        if (saveError) {
          console.error("Error saving diagram:", saveError);
        } else if (savedDiagram) {
          setCurrentDiagramId(savedDiagram.id);
          setShareToken(savedDiagram.share_token);
          setIsPublic(savedDiagram.is_public);
        }
      }
    } catch (error: any) {
      console.error("Error generating diagram:", error);
      toast.error(error.message || "Failed to generate diagram");
    } finally {
      if (isPreview) {
        setPreviewLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const generateDiagram = () => generateDiagramWithPreview(false);

  // Real-time preview with debouncing
  useEffect(() => {
    if (!showPreview || !prompt.trim() || prompt.length < 10) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      generateDiagramWithPreview(true);
    }, 2000); // 2 second debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [prompt, style, showPreview]);

  const styles = [
    { id: "colored", label: "Colored", description: "Vibrant and modern" },
    { id: "hand-drawn", label: "Hand-Drawn", description: "Sketch-like style" },
    { id: "aws", label: "AWS Icons", description: "Cloud architecture" },
  ];

  const handleSelectExample = (examplePrompt: string, exampleStyle: string) => {
    setPrompt(examplePrompt);
    setStyle(exampleStyle);
    toast.success("Example loaded! Click generate to create diagram.");
  };

  const handleSelectDiagram = (selectedDiagram: any) => {
    setPrompt(selectedDiagram.prompt);
    setStyle(selectedDiagram.style);
    setDiagram(selectedDiagram.diagram_data);
    setCurrentDiagramId(selectedDiagram.id);
    setShareToken(selectedDiagram.share_token);
    setIsPublic(selectedDiagram.is_public);
    toast.success("Diagram loaded from history");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[var(--shadow-primary)]">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                DiagramAI
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <FeedbackDialog />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <History className="w-4 h-4 mr-2" />
                    History
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                  {user && <DiagramHistory onSelectDiagram={handleSelectDiagram} userId={user.id} />}
                </SheetContent>
              </Sheet>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          
          {/* Subscription Status Banner */}
          <Alert className={`${plan === "free" ? "border-muted" : "border-primary bg-primary/5"}`}>
            <AlertDescription className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {plan !== "free" && <Crown className="w-4 h-4 text-primary" />}
                <span className="font-medium capitalize">{plan} Plan</span>
                {plan === "free" && (
                  <span className="text-xs text-muted-foreground">• 50 diagrams/hour</span>
                )}
                {plan !== "free" && (
                  <span className="text-xs text-muted-foreground">• Unlimited diagrams</span>
                )}
              </div>
              <div className="flex gap-2">
                {plan === "free" ? (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => openCheckout("price_1SDuIG52ySA6lezKSi8o7c2O")}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Upgrade to Pro
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={openPortal}>
                    Manage Subscription
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Examples Sidebar */}
          <Card className="shadow-[var(--shadow-card)] border-border/50 h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <ExamplePrompts onSelectExample={handleSelectExample} />
            </CardContent>
          </Card>

          {/* Main Content Area */}
          <div className="space-y-6">
            {/* Input Section */}
            <Card className="shadow-[var(--shadow-card)] border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Generate Diagram
                </CardTitle>
                <CardDescription>
                  Describe your architecture or system in natural language
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Your Prompt</label>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={showPreview}
                          onChange={(e) => setShowPreview(e.target.checked)}
                          className="rounded"
                        />
                        Real-time preview
                      </label>
                    </div>
                  </div>
                  <Textarea
                    placeholder="e.g., Create a microservices architecture with API gateway, user service, payment service, and PostgreSQL database"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                  {showPreview && previewLoading && (
                    <p className="text-xs text-muted-foreground animate-pulse">
                      Generating preview...
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Style</label>
                  <div className="grid grid-cols-3 gap-3">
                    {styles.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          style === s.id
                            ? "border-primary bg-primary/5 shadow-[var(--shadow-primary)]"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-medium text-sm mb-1">{s.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={generateDiagram}
                  variant="hero"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Diagram
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Output Section - Full Width */}
            <Card className="shadow-[var(--shadow-card)] border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated Diagram</CardTitle>
                    <CardDescription>
                      Your AI-generated architecture diagram
                    </CardDescription>
                  </div>
                  {diagram && currentDiagramId && (
                    <DiagramExport 
                      diagramRef={mermaidRef} 
                      diagramId={currentDiagramId || undefined}
                      shareToken={shareToken || undefined}
                      isPublic={isPublic}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-[600px] space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Generating your diagram...</p>
                  </div>
                ) : diagram ? (
                  <div className="bg-background rounded-lg p-8 border border-border overflow-auto">
                    <div ref={mermaidRef} className="flex items-center justify-center min-h-[700px] w-full" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[600px] space-y-4 text-center">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium mb-2">No diagram yet</p>
                      <p className="text-sm text-muted-foreground">
                        Enter a prompt and click generate to create your diagram
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Badge */}
        <div className="mt-8 flex justify-center">
          <Badge variant="secondary" className="px-4 py-2">
            💡 Gemini models are free during October 2025 
            {plan === "free" && " • Free tier: 50 diagrams per hour"}
          </Badge>
        </div>
      </main>
    </div>
  );
};

export default Generate;