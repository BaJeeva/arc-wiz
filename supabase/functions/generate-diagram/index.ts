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

    // Build icon URLs based on style/cloud providers
    let iconInstructions = '';
    if (style === 'aws' || prompt.toLowerCase().includes('aws')) {
      iconInstructions = `
MANDATORY: Use these exact AWS service icon URLs in your diagram:
${Object.entries(ICON_LIBRARIES.aws).map(([key, url]) => `- ${key.toUpperCase()}: ${url}`).join('\n')}

Example node format: A["<img src='${ICON_LIBRARIES.aws.ec2}' width='50'><br><b>EC2 Instance</b>"]`;
    } else if (style === 'azure' || prompt.toLowerCase().includes('azure')) {
      iconInstructions = `
MANDATORY: Use these exact Azure service icon URLs in your diagram:
${Object.entries(ICON_LIBRARIES.azure).map(([key, url]) => `- ${key.toUpperCase()}: ${url}`).join('\n')}

Example node format: A["<img src='${ICON_LIBRARIES.azure.vm}' width='50'><br><b>Virtual Machine</b>"]`;
    } else if (style === 'gcp' || prompt.toLowerCase().includes('gcp') || prompt.toLowerCase().includes('google cloud')) {
      iconInstructions = `
MANDATORY: Use these exact GCP service icon URLs in your diagram:
${Object.entries(ICON_LIBRARIES.gcp).map(([key, url]) => `- ${key.toUpperCase()}: ${url}`).join('\n')}

Example node format: A["<img src='${ICON_LIBRARIES.gcp.compute}' width='50'><br><b>Compute Engine</b>"]`;
    }

    const systemPrompt = `You are an expert at creating professional architecture diagrams using Mermaid syntax, similar to eraser.io's AI diagram capabilities.

CRITICAL RULES - FOLLOW EXACTLY:
1. Output ONLY pure Mermaid syntax - NO explanatory text before or after
2. Start directly with "graph TD" or "graph LR" or other mermaid diagram type
3. ALWAYS embed service icons using the provided URLs
4. Icon format MUST be: NodeID["<img src='ICON_URL' width='50'><br><b>Service Name</b>"]
5. Use subgraphs to group related services
6. Add clear arrow labels showing data flow
7. Apply professional color styling

EDGE LABEL SYNTAX RULES (CRITICAL):
- Keep edge labels simple: -->|Simple text| or -->|"Quoted text"|
- NEVER use parentheses () in edge labels
- NEVER use special chars like @#$%& in labels
- Good: -->|Notifies| or -->|HTTP Request| or -->|"Sends data"|
- Bad: -->|Notify (e.g., user signup)| or -->|Call @service|

${styleInstruction}

${iconInstructions}

OUTPUT FORMAT - CRITICAL:
- Start immediately with diagram type (graph TD, sequenceDiagram, etc.)
- No prose, no explanations, no markdown except the diagram itself
- Every cloud service MUST have its icon embedded
- Use double quotes for labels with HTML

Example (AWS):
graph TD
    A["<img src='${ICON_LIBRARIES.aws.api_gateway}' width='50'><br><b>API Gateway</b>"]
    B["<img src='${ICON_LIBRARIES.aws.lambda}' width='50'><br><b>Lambda Function</b>"]
    C["<img src='${ICON_LIBRARIES.aws.rds}' width='50'><br><b>RDS Database</b>"]
    A -->|HTTP Request| B
    B -->|Query| C
    
    style A fill:#D6EAF8,stroke:#3498DB
    style B fill:#D4EFDF,stroke:#28B463
    style C fill:#FADBD8,stroke:#CB4335`;

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
    let content = data.choices?.[0]?.message?.content as string | undefined;

    if (!content) {
      console.error('No diagram content in response');
      return new Response(
        JSON.stringify({ error: 'Failed to generate diagram content' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Extract mermaid code block if wrapped in fences
    const mm = content.match(/```mermaid\s*([\s\S]*?)```/i);
    const any = content.match(/```\s*([\s\S]*?)```/i);
    let cleaned = (mm ? mm[1] : (any ? any[1] : content)).trim();
    
    // Remove any leading/trailing prose that might have snuck in
    const lines = cleaned.split('\n');
    const firstDiagramLine = lines.findIndex(l => 
      l.trim().startsWith('graph ') || 
      l.trim().startsWith('sequenceDiagram') || 
      l.trim().startsWith('classDiagram') ||
      l.trim().startsWith('flowchart') ||
      l.trim().startsWith('erDiagram') ||
      l.trim().startsWith('gantt')
    );
    
    if (firstDiagramLine > 0) {
      cleaned = lines.slice(firstDiagramLine).join('\n').trim();
    }
    
    // Sanitize edge labels to prevent syntax errors with parentheses
    cleaned = cleaned.replace(/\|([^|]*?)\([^)]*?\)([^|]*?)\|/g, (match, before, after) => {
      return `|${before.trim()} ${after.trim()}|`;
    });

    console.log('Successfully generated diagram. First 200 chars:', cleaned.substring(0, 200));

    return new Response(
      JSON.stringify({ diagram: cleaned }),
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