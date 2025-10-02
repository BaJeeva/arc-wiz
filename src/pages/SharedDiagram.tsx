import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import mermaid from "mermaid";
import { DiagramExport } from "@/components/DiagramExport";

const SharedDiagram = () => {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const [diagram, setDiagram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    fetchSharedDiagram();
  }, [shareToken]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (diagram?.diagram_data && mermaidRef.current) {
        try {
          mermaidRef.current.innerHTML = '';
          const { svg } = await mermaid.render('shared-diagram', diagram.diagram_data);
          mermaidRef.current.innerHTML = svg;
        } catch (error) {
          console.error('Error rendering diagram:', error);
          toast.error('Failed to render diagram');
        }
      }
    };
    renderDiagram();
  }, [diagram]);

  const fetchSharedDiagram = async () => {
    try {
      const { data, error } = await supabase
        .from("diagrams")
        .select("*")
        .eq("share_token", shareToken)
        .eq("is_public", true)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error("Diagram not found or not shared");
        navigate("/");
        return;
      }

      // Check if link has expired
      if (data.expires_at) {
        const expirationDate = new Date(data.expires_at);
        if (expirationDate < new Date()) {
          toast.error("This share link has expired");
          navigate("/");
          return;
        }
      }

      setDiagram(data);
    } catch (error) {
      console.error("Error fetching shared diagram:", error);
      toast.error("Failed to load shared diagram");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading shared diagram...</p>
          </div>
        ) : diagram ? (
          <Card className="shadow-[var(--shadow-card)] border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Shared Diagram</CardTitle>
                  <CardDescription className="mt-2">
                    {diagram.prompt}
                  </CardDescription>
                </div>
                <DiagramExport diagramRef={mermaidRef} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-background rounded-lg p-6 border border-border overflow-auto max-h-[600px]">
                <div ref={mermaidRef} className="flex items-center justify-center min-h-[400px]" />
              </div>
              <div className="mt-6 text-center">
                <Button onClick={() => navigate("/auth")}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Your Own Diagrams
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
};

export default SharedDiagram;
