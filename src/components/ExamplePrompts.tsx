import { Card } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface ExamplePromptsProps {
  onSelectExample: (prompt: string, style: string) => void;
}

const examples = [
  {
    prompt: "Create a microservices architecture with API gateway, user service, payment service, and PostgreSQL database",
    style: "colored",
    category: "Architecture"
  },
  {
    prompt: "Design a Kubernetes cluster with ingress controller, multiple deployments, services, and persistent volumes",
    style: "aws",
    category: "Cloud"
  },
  {
    prompt: "Show a CI/CD pipeline with GitHub, Jenkins, Docker, and deployment to production",
    style: "hand-drawn",
    category: "DevOps"
  },
  {
    prompt: "Create an AWS multi-region setup with VPCs, load balancers, EC2 instances, RDS, and S3",
    style: "aws",
    category: "Cloud"
  },
  {
    prompt: "Design a user authentication flow with login, registration, password reset, and OAuth",
    style: "hand-drawn",
    category: "Flow"
  },
  {
    prompt: "Show a React application architecture with components, state management, API calls, and routing",
    style: "colored",
    category: "Frontend"
  }
];

export const ExamplePrompts = ({ onSelectExample }: ExamplePromptsProps) => {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2 text-sm">
        <Lightbulb className="w-4 h-4 text-primary" />
        Example Prompts
      </h3>
      <div className="grid gap-2">
        {examples.map((example, index) => (
          <Card
            key={index}
            className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
            onClick={() => onSelectExample(example.prompt, example.style)}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="text-xs font-medium text-primary mb-1">
                  {example.category}
                </div>
                <p className="text-sm line-clamp-2">{example.prompt}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
