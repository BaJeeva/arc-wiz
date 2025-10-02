import { Button } from "@/components/ui/button";
import { Download, Share2, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DiagramExportProps {
  diagramRef: React.RefObject<HTMLDivElement>;
  diagramId?: string;
  shareToken?: string;
  isPublic?: boolean;
}

export const DiagramExport = ({ diagramRef, diagramId, shareToken, isPublic }: DiagramExportProps) => {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [expirationDays, setExpirationDays] = useState<string>("7");

  const exportAsSVG = () => {
    if (!diagramRef.current) return;
    
    const svg = diagramRef.current.querySelector("svg");
    if (!svg) {
      toast.error("No diagram to export");
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "diagram.svg";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("SVG exported");
  };

  const exportAsPNG = async () => {
    if (!diagramRef.current) return;
    
    const svg = diagramRef.current.querySelector("svg");
    if (!svg) {
      toast.error("No diagram to export");
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = pngUrl;
            link.download = "diagram.png";
            link.click();
            URL.revokeObjectURL(pngUrl);
            toast.success("PNG exported");
          }
        });
      };

      img.src = url;
    } catch (error) {
      console.error("Error exporting PNG:", error);
      toast.error("Failed to export PNG");
    }
  };

  const exportAsPDF = async () => {
    if (!diagramRef.current) return;
    
    const svg = diagramRef.current.querySelector("svg");
    if (!svg) {
      toast.error("No diagram to export");
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        // Create PDF
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save("diagram.pdf");
        toast.success("PDF exported");
      };

      img.src = url;
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleShare = async () => {
    if (!diagramId) {
      toast.error("Save the diagram first to share");
      return;
    }

    setSharing(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expirationDays));

      const { error } = await supabase
        .from("diagrams")
        .update({ 
          is_public: true,
          expires_at: expiresAt.toISOString()
        })
        .eq("id", diagramId);

      if (error) throw error;

      const shareUrl = `${window.location.origin}/shared/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(`Share link copied! Expires in ${expirationDays} days`);
    } catch (error) {
      console.error("Error sharing diagram:", error);
      toast.error("Failed to create share link");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={exportAsSVG}>
        <Download className="w-4 h-4 mr-2" />
        Export SVG
      </Button>
      <Button variant="outline" size="sm" onClick={exportAsPNG}>
        <Download className="w-4 h-4 mr-2" />
        Export PNG
      </Button>
      <Button variant="outline" size="sm" onClick={exportAsPDF}>
        <Download className="w-4 h-4 mr-2" />
        Export PDF
      </Button>
      <div className="flex items-center gap-2">
        <Select value={expirationDays} onValueChange={setExpirationDays}>
          <SelectTrigger className="w-[140px] h-9">
            <Clock className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 day</SelectItem>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
            <SelectItem value="365">1 year</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleShare}
          disabled={sharing || !diagramId}
        >
          {copied ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Share2 className="w-4 h-4 mr-2" />
          )}
          {copied ? "Link Copied!" : "Share"}
        </Button>
      </div>
    </div>
  );
};
