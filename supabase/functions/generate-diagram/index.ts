import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Diagram templates for common patterns
const DIAGRAM_TEMPLATES: Record<string, string> = {
  kubernetes: `Generate a detailed Kubernetes architecture diagram using flowchart syntax with these elements:
- Ingress Controller
- Services
- Deployments/Pods
- ConfigMaps/Secrets
- Persistent Volumes
Use proper Kubernetes terminology and group related components.`,
  
  aws: `Generate an AWS cloud architecture diagram using flowchart syntax with these elements:
- VPC and subnets
- Load Balancers (ALB/ELB)
- EC2 instances or container services
- RDS databases
- S3 storage
- Security Groups
Use AWS service names and show connections between services.`,
  
  microservices: `Generate a microservices architecture diagram using flowchart syntax with:
- API Gateway
- Multiple microservices
- Databases (one per service if needed)
- Message queues/Event buses
- Cache layers
Show service-to-service communication and data flow.`,
  
  cicd: `Generate a CI/CD pipeline diagram using flowchart syntax showing:
- Source control (GitHub/GitLab)
- Build stage
- Test stage
- Deploy stage
- Production environment
Use clear arrows showing the flow from code commit to deployment.`,
};

const detectTemplate = (prompt: string): string | null => {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('kubernetes') || lowerPrompt.includes('k8s') || lowerPrompt.includes('ingress')) {
    return 'kubernetes';
  }
  if (lowerPrompt.includes('aws') || lowerPrompt.includes('vpc') || lowerPrompt.includes('ec2') || lowerPrompt.includes('s3')) {
    return 'aws';
  }
  if (lowerPrompt.includes('microservice') || lowerPrompt.includes('api gateway')) {
    return 'microservices';
  }
  if (lowerPrompt.includes('ci/cd') || lowerPrompt.includes('pipeline') || lowerPrompt.includes('jenkins')) {
    return 'cicd';
  }
  
  return null;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style, userId } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Rate limiting check
    if (userId) {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const { data: canProceed } = await supabase.rpc('check_rate_limit', {
          _user_id: userId,
          _max_requests: 50, // 50 requests per hour for free users
          _window_minutes: 60
        });

        if (!canProceed) {
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded. You can make up to 50 requests per hour. Please try again later or upgrade to a premium plan.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
          );
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Detect and apply template
    const template = detectTemplate(prompt);
    let enhancedPrompt = prompt;
    
    if (template) {
      console.log(`Detected template: ${template}`);
      enhancedPrompt = `${DIAGRAM_TEMPLATES[template]}\n\nUser's specific request: ${prompt}`;
    }

    // Build system prompt based on style
    let styleInstruction = '';
    if (style === 'hand-drawn') {
      styleInstruction = 'Use a hand-drawn, sketch-like notation style.';
    } else if (style === 'aws') {
      styleInstruction = 'Include AWS service names and icons where appropriate.';
    } else {
      styleInstruction = 'Use clear, colored boxes and connectors.';
    }

    const systemPrompt = `You are an expert at creating architecture diagrams using Mermaid syntax.
Generate clear, well-structured diagrams based on user descriptions.
${styleInstruction}
Always output valid Mermaid diagram syntax that can be rendered.
Focus on clarity and proper relationships between components.
Use appropriate diagram types (flowchart, sequence, class, etc.) based on the use case.`;

    console.log('Generating diagram for prompt:', prompt, 'with style:', style);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a diagram for: ${enhancedPrompt}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to generate diagram' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const data = await response.json();
    const diagram = data.choices?.[0]?.message?.content;

    if (!diagram) {
      console.error('No diagram content in response');
      return new Response(
        JSON.stringify({ error: 'Failed to generate diagram content' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Successfully generated diagram');

    return new Response(
      JSON.stringify({ diagram }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-diagram function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});