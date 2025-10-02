-- Add shareable link support to diagrams table
ALTER TABLE public.diagrams 
ADD COLUMN share_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Create index for faster share token lookups
CREATE INDEX idx_diagrams_share_token ON public.diagrams(share_token);

-- Add policy for public access to shared diagrams
CREATE POLICY "Anyone can view publicly shared diagrams" 
ON public.diagrams 
FOR SELECT 
USING (is_public = true);