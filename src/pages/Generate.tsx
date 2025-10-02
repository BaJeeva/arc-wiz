import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, LogOut, Loader2, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import mermaid from "mermaid";
import { DiagramHistory } from "@/components/DiagramHistory";
import { ExamplePrompts } from "@/components/ExamplePrompts";
import { DiagramExport } from "@/components/DiagramExport";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Generate = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("colored");
  const [loading, setLoading] = useState(false);
  const [diagram, setDiagram] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const mermaidRef = useRef<HTMLDivElement>(null);

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

  const generateDiagram = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    setDiagram(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-diagram", {
        body: { prompt, style },
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes("Rate limit") || data.error.includes("429")) {
          toast.error("Rate limit exceeded. Please try again in a moment.");
        } else if (data.error.includes("Payment required") || data.error.includes("402")) {
          toast.error("Payment required. Please add credits to your workspace.");
        } else {
          toast.error(data.error);
        }
        return;
      }

      setDiagram(data.diagram);
      toast.success("Diagram generated!");

      // Save to database
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
    } catch (error: any) {
      console.error("Error generating diagram:", error);
      toast.error(error.message || "Failed to generate diagram");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Examples Sidebar */}
          <Card className="shadow-[var(--shadow-card)] border-border/50 h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Get Started</CardTitle>
            </CardHeader>
            <CardContent>
              <ExamplePrompts onSelectExample={handleSelectExample} />
            </CardContent>
          </Card>

          {/* Input Section */}
          <Card className="shadow-[var(--shadow-card)] border-border/50 h-fit lg:col-span-2">
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
                <label className="text-sm font-medium">Your Prompt</label>
                <Textarea
                  placeholder="e.g., Create a microservices architecture with API gateway, user service, payment service, and PostgreSQL database"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[150px] resize-none"
                />
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

          {/* Output Section */}
          <Card className="shadow-[var(--shadow-card)] border-border/50">
            <CardHeader>
              <CardTitle>Generated Diagram</CardTitle>
              <CardDescription>
                Your AI-generated architecture diagram
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Generating your diagram...</p>
                </div>
              ) : diagram ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <DiagramExport 
                      diagramRef={mermaidRef} 
                      diagramId={currentDiagramId || undefined}
                      shareToken={shareToken || undefined}
                      isPublic={isPublic}
                    />
                  </div>
                  <div className="bg-background rounded-lg p-6 border border-border overflow-auto max-h-[600px]">
                    <div ref={mermaidRef} className="flex items-center justify-center min-h-[400px]" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center">
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

        {/* Info Badge */}
        <div className="mt-8 flex justify-center">
          <Badge variant="secondary" className="px-4 py-2">
            💡 Powered by Lovable AI - Gemini models are free during October 2025
          </Badge>
        </div>
      </main>
    </div>
  );
};

export default Generate;