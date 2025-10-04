import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface DiagramConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt: string;
  onGenerate: (config: DiagramConfig) => void;
  loading: boolean;
}

export interface DiagramConfig {
  prompt: string;
  diagramType: string[];
  complexity: string;
  cloudProviders: string[];
  additionalDetails: string;
}

export const DiagramConfigDialog = ({
  open,
  onOpenChange,
  initialPrompt,
  onGenerate,
  loading,
}: DiagramConfigDialogProps) => {
  const [diagramType, setDiagramType] = useState<string[]>([]);
  const [complexity, setComplexity] = useState("medium");
  const [cloudProviders, setCloudProviders] = useState<string[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState("");

  const handleDiagramTypeToggle = (type: string) => {
    setDiagramType((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleCloudProviderToggle = (provider: string) => {
    setCloudProviders((prev) =>
      prev.includes(provider) ? prev.filter((p) => p !== provider) : [...prev, provider]
    );
  };

  const handleGenerate = () => {
    onGenerate({
      prompt: initialPrompt,
      diagramType,
      complexity,
      cloudProviders,
      additionalDetails,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Configure Your Diagram</DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Question 1: Diagram Type */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              1. What type of diagram elements should be included?
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                "Architecture components",
                "Data flow",
                "Security layers",
                "Network topology",
                "Database design",
                "API interactions",
              ].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={diagramType.includes(type)}
                    onCheckedChange={() => handleDiagramTypeToggle(type)}
                  />
                  <Label htmlFor={type} className="cursor-pointer font-normal">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Question 2: Complexity Level */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              2. What level of detail do you need?
            </h3>
            <RadioGroup value={complexity} onValueChange={setComplexity}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="simple" id="simple" />
                <Label htmlFor="simple" className="cursor-pointer font-normal">
                  Simple - High-level overview with minimal details
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="cursor-pointer font-normal">
                  Medium - Balanced detail with key components
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed" className="cursor-pointer font-normal">
                  Detailed - Comprehensive with all components and relationships
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Question 3: Cloud Providers */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              3. Which cloud providers should be represented with icons?
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                "AWS",
                "Azure",
                "Google Cloud (GCP)",
                "Kubernetes",
                "Docker",
                "Generic cloud icons",
              ].map((provider) => (
                <div key={provider} className="flex items-center space-x-2">
                  <Checkbox
                    id={provider}
                    checked={cloudProviders.includes(provider)}
                    onCheckedChange={() => handleCloudProviderToggle(provider)}
                  />
                  <Label htmlFor={provider} className="cursor-pointer font-normal">
                    {provider}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Question 4: Additional Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">
              4. Any specific requirements or constraints?
            </h3>
            <Textarea
              placeholder="e.g., Must show redundancy, include monitoring components, highlight security boundaries..."
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="min-w-[200px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Diagram"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
