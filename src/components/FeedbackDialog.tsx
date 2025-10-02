import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const FeedbackDialog = () => {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    setSending(true);
    try {
      // In a real app, send to backend or email service
      console.log("Feedback submitted:", feedback);
      toast.success("Thank you for your feedback!");
      setFeedback("");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to send feedback");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="w-4 h-4 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve DiagramAI by sharing your thoughts and suggestions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="What can we improve? What features would you like to see?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[150px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={sending}>
              {sending ? "Sending..." : "Send Feedback"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
