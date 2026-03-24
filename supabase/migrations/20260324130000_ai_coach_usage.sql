-- Rate limiting table for AI coach (Free plan: 5 messages/day)
-- Uses UTC date for daily reset (simple, no timezone complexity)

CREATE TABLE IF NOT EXISTS public.ai_coach_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  message_count integer NOT NULL DEFAULT 1,
  UNIQUE(user_id, usage_date)
);

ALTER TABLE public.ai_coach_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own usage"
  ON public.ai_coach_usage FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS ai_coach_usage_user_date
  ON public.ai_coach_usage(user_id, usage_date);

-- Atomic increment function for rate limiting
-- Returns the new message_count after increment
CREATE OR REPLACE FUNCTION public.increment_ai_coach_usage(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO public.ai_coach_usage (user_id, usage_date, message_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET message_count = ai_coach_usage.message_count + 1
  RETURNING message_count INTO v_count;

  RETURN v_count;
END;
$$;
