-- Add expiration column to diagrams table
ALTER TABLE public.diagrams 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient expiration queries
CREATE INDEX idx_diagrams_expires_at ON public.diagrams(expires_at) WHERE expires_at IS NOT NULL;