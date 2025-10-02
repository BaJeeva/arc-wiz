-- Add rate limiting table
CREATE TABLE IF NOT EXISTS public.user_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own rate limits"
ON public.user_rate_limits
FOR SELECT
USING (auth.uid() = user_id);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id UUID,
  _max_requests INTEGER DEFAULT 50,
  _window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get or create rate limit record
  SELECT request_count, user_rate_limits.window_start
  INTO current_count, window_start
  FROM user_rate_limits
  WHERE user_id = _user_id;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_rate_limits (user_id, request_count, window_start)
    VALUES (_user_id, 1, now());
    RETURN TRUE;
  END IF;

  -- Check if window has expired
  IF now() - window_start > make_interval(mins => _window_minutes) THEN
    -- Reset window
    UPDATE user_rate_limits
    SET request_count = 1, window_start = now()
    WHERE user_id = _user_id;
    RETURN TRUE;
  END IF;

  -- Check if under limit
  IF current_count < _max_requests THEN
    UPDATE user_rate_limits
    SET request_count = request_count + 1
    WHERE user_id = _user_id;
    RETURN TRUE;
  END IF;

  -- Over limit
  RETURN FALSE;
END;
$$;