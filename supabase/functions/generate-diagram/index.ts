import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cloud provider icon libraries
const ICON_LIBRARIES = {
  aws: {
    ec2: 'https://static-00.iconduck.com/assets.00/aws-ec2-icon-1024x1024-oq0iq8og.png',
    s3: 'https://static-00.iconduck.com/assets.00/aws-s3-icon-1024x1024-8jdv35os.png',
    rds: 'https://static-00.iconduck.com/assets.00/aws-rds-icon-2048x2048-0k25w74a.png',
    lambda: 'https://static-00.iconduck.com/assets.00/aws-lambda-icon-1024x1024-v1zxqw9v.png',
    vpc: 'https://static-00.iconduck.com/assets.00/aws-vpc-icon-2048x2048-7v7u8ixl.png',
    elb: 'https://static-00.iconduck.com/assets.00/aws-elastic-load-balancing-icon-2048x2048-ew0gd0w7.png',
    cloudfront: 'https://static-00.iconduck.com/assets.00/aws-cloudfront-icon-2048x2048-1fxhzj6r.png',
    dynamodb: 'https://static-00.iconduck.com/assets.00/aws-dynamodb-icon-2048x2048-uq4scgex.png',
    sqs: 'https://static-00.iconduck.com/assets.00/aws-sqs-icon-1024x1024-h14u7hys.png',
    sns: 'https://static-00.iconduck.com/assets.00/aws-sns-icon-2048x2048-bsv2juw3.png',
    elasticache: 'https://static-00.iconduck.com/assets.00/aws-elasticache-icon-2048x1731-8knt2j3b.png',
    api_gateway: 'https://static-00.iconduck.com/assets.00/aws-api-gateway-icon-2048x2048-xqw0u6xp.png',
    ecs: 'https://static-00.iconduck.com/assets.00/aws-ecs-icon-2048x2048-k89zd31u.png',
    eks: 'https://static-00.iconduck.com/assets.00/aws-eks-icon-2048x2048-v0i70o1x.png',
  },
  azure: {
    vm: 'https://cdn.worldvectorlogo.com/logos/azure-1.svg',
    storage: 'https://cdn.worldvectorlogo.com/logos/azure-1.svg',
    sql: 'https://cdn.worldvectorlogo.com/logos/azure-sql-database.svg',
    functions: 'https://cdn.worldvectorlogo.com/logos/azure-1.svg',
    kubernetes: 'https://cdn.worldvectorlogo.com/logos/azure-1.svg',
    cosmos: 'https://cdn.worldvectorlogo.com/logos/azure-cosmos-db.svg',
  },
  gcp: {
    compute: 'https://www.gstatic.com/images/branding/product/2x/compute_engine_64dp.png',
    storage: 'https://www.gstatic.com/images/branding/product/2x/cloud_storage_64dp.png',
    sql: 'https://www.gstatic.com/images/branding/product/2x/cloud_sql_64dp.png',
    functions: 'https://www.gstatic.com/images/branding/product/2x/cloud_functions_64dp.png',
    kubernetes: 'https://www.gstatic.com/images/branding/product/2x/kubernetes_engine_64dp.png',
  },
};

// Diagram templates for common patterns
const DIAGRAM_TEMPLATES: Record<string, string> = {
  kubernetes: `Generate a detailed Kubernetes architecture diagram using flowchart syntax with these elements:
- Ingress Controller
- Services
- Deployments/Pods
- ConfigMaps/Secrets
- Persistent Volumes
Use proper Kubernetes terminology and group related components.
Use container/orchestration icons where applicable.`,
  
  aws: `Generate an AWS cloud architecture diagram using flowchart syntax.
IMPORTANT: Use AWS service icons from this library:
${JSON.stringify(ICON_LIBRARIES.aws, null, 2)}

Include these elements with their respective icons:
- VPC and subnets
- Load Balancers (use ELB icon)
- EC2 instances (use EC2 icon)
- RDS databases (use RDS icon)
- S3 storage (use S3 icon)
- Lambda functions (use Lambda icon)
- ElastiCache (use ElastiCache icon)
- API Gateway (use API Gateway icon)
- SQS/SNS for messaging (use respective icons)

Format icons in nodes like: [<img src='ICON_URL' width='50px'><br>Service Name]
Use AWS service names and show connections between services.`,

  azure: `Generate an Azure cloud architecture diagram using flowchart syntax.
IMPORTANT: Use Azure service icons from this library:
${JSON.stringify(ICON_LIBRARIES.azure, null, 2)}

Include these elements with their respective icons:
- Virtual Machines
- Azure Storage
- Azure SQL Database
- Azure Functions
- Azure Kubernetes Service
- Cosmos DB

Format icons in nodes like: [<img src='ICON_URL' width='50px'><br>Service Name]
Use Azure service names and show connections between services.`,

  gcp: `Generate a Google Cloud Platform architecture diagram using flowchart syntax.
IMPORTANT: Use GCP service icons from this library:
${JSON.stringify(ICON_LIBRARIES.gcp, null, 2)}

Include these elements with their respective icons:
- Compute Engine
- Cloud Storage
- Cloud SQL
- Cloud Functions
- Google Kubernetes Engine

Format icons in nodes like: [<img src='ICON_URL' width='50px'><br>Service Name]
Use GCP service names and show connections between services.`,
  
  microservices: `Generate a microservices architecture diagram using flowchart syntax with:
- API Gateway (use cloud provider API gateway icon if applicable)
- Multiple microservices
- Databases (one per service if needed - use appropriate DB icons)
- Message queues/Event buses (use SQS/SNS or similar icons)
- Cache layers (use Redis/ElastiCache icons)
Show service-to-service communication and data flow.
Use appropriate cloud provider icons where relevant.`,
  
  cicd: `Generate a CI/CD pipeline diagram using flowchart syntax showing:
- Source control (GitHub/GitLab)
- Build stage (Jenkins/GitHub Actions)
- Test stage
- Containerization (Docker)
- Deploy stage (Kubernetes/ECS)
- Production environment (with cloud provider icons)
Use clear arrows showing the flow from code commit to deployment.`,
};

const detectTemplate = (prompt: string): string | null => {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('kubernetes') || lowerPrompt.includes('k8s') || lowerPrompt.includes('ingress')) {
    return 'kubernetes';
  }
  if (lowerPrompt.includes('aws') || lowerPrompt.includes('vpc') || lowerPrompt.includes('ec2') || lowerPrompt.includes('s3') || lowerPrompt.includes('lambda') || lowerPrompt.includes('rds')) {
    return 'aws';
  }
  if (lowerPrompt.includes('azure') || lowerPrompt.includes('virtual machine') || lowerPrompt.includes('cosmos')) {
    return 'azure';
  }
  if (lowerPrompt.includes('gcp') || lowerPrompt.includes('google cloud') || lowerPrompt.includes('compute engine')) {
    return 'gcp';
  }
  if (lowerPrompt.includes('microservice') || lowerPrompt.includes('api gateway')) {
    return 'microservices';
  }
  if (lowerPrompt.includes('ci/cd') || lowerPrompt.includes('pipeline') || lowerPrompt.includes('jenkins') || lowerPrompt.includes('github actions')) {
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
      styleInstruction = `Use a hand-drawn, sketch-like notation style with curved edges.
Add classDef for hand-drawn appearance: classDef handdrawn fill:#ffffff,stroke:#333,stroke-width:2px;`;
    } else if (style === 'aws') {
      styleInstruction = `Include AWS service icons from the provided library.
Format: [<img src='ICON_URL' width='50px'><br>Service Name]
Use professional AWS architecture diagram styling with proper colors:
- style for compute services: fill:#D4EFDF,stroke:#28B463
- style for storage: fill:#FADBD8,stroke:#CB4335
- style for networking: fill:#D6EAF8,stroke:#3498DB
- style for databases: fill:#FADBD8,stroke:#CB4335`;
    } else if (style === 'azure') {
      styleInstruction = `Include Azure service icons from the provided library.
Format: [<img src='ICON_URL' width='50px'><br>Service Name]
Use Azure's color palette in styling.`;
    } else if (style === 'gcp') {
      styleInstruction = `Include Google Cloud Platform service icons from the provided library.
Format: [<img src='ICON_URL' width='50px'><br>Service Name]
Use GCP's color palette in styling.`;
    } else {
      styleInstruction = 'Use clear, colored boxes and connectors with professional styling.';
    }

    const systemPrompt = `You are an expert at creating professional architecture diagrams using Mermaid syntax, similar to eraser.io's AI diagram capabilities.

CRITICAL RULES:
1. ALWAYS use cloud provider service icons when mentioned (AWS, Azure, GCP)
2. Format icons as: [<img src='ICON_URL' width='50px'><br>Service Name]
3. Use proper Mermaid syntax: graph TD or LR for flowcharts
4. Add professional styling with colors that match the cloud provider
5. Show clear data flow and relationships between components
6. Use subgraphs to group related services
7. Include proper arrow labels to show interactions

${styleInstruction}

Always output ONLY valid Mermaid diagram syntax wrapped in \`\`\`mermaid blocks.
Focus on clarity, professional appearance, and accurate cloud architecture representations.
Use appropriate diagram types (flowchart, sequence, class, etc.) based on the use case.

ICON LIBRARIES AVAILABLE:
AWS: EC2, S3, RDS, Lambda, VPC, ELB, CloudFront, DynamoDB, SQS, SNS, ElastiCache, API Gateway, ECS, EKS
Azure: VM, Storage, SQL, Functions, Kubernetes, Cosmos DB
GCP: Compute Engine, Cloud Storage, Cloud SQL, Cloud Functions, Kubernetes Engine`;

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