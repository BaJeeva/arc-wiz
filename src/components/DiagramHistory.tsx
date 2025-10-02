import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Diagram {
  id: string;
  prompt: string;
  style: string;
  created_at: string;
  diagram_data: string;
}

interface DiagramHistoryProps {
  onSelectDiagram: (diagram: Diagram) => void;
  userId: string;
}

export const DiagramHistory = ({ onSelectDiagram, userId }: DiagramHistoryProps) => {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDiagrams = async () => {
    try {
      const { data, error } = await supabase
        .from("diagrams")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setDiagrams(data || []);
    } catch (error) {
      console.error("Error fetching diagrams:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagrams();

    // Set up realtime subscription
    const channel = supabase
      .channel("diagrams-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "diagrams",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchDiagrams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from("diagrams").delete().eq("id", id);
      if (error) throw error;
      toast.success("Diagram deleted");
    } catch (error) {
      console.error("Error deleting diagram:", error);
      toast.error("Failed to delete diagram");
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading history...
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Diagrams
        </h3>
        {diagrams.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No diagrams yet
          </p>
        ) : (
          diagrams.map((diagram) => (
            <Card
              key={diagram.id}
              className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => onSelectDiagram(diagram)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 mb-1">
                    {diagram.prompt}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{diagram.style}</span>
                    <span>•</span>
                    <span>
                      {new Date(diagram.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDelete(diagram.id, e)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </ScrollArea>
  );
};
