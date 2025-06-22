
-- Create table to store QR code scan results
CREATE TABLE public.qr_scan_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  qr_data TEXT NOT NULL,
  scan_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  security_checks JSONB NOT NULL DEFAULT '{}',
  overall_risk TEXT CHECK (overall_risk IN ('LOW', 'MEDIUM', 'HIGH')) DEFAULT 'LOW',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.qr_scan_results ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own scan results" 
  ON public.qr_scan_results 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own scan results" 
  ON public.qr_scan_results 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create index for better performance
CREATE INDEX idx_qr_scan_results_user_id ON public.qr_scan_results(user_id);
CREATE INDEX idx_qr_scan_results_timestamp ON public.qr_scan_results(scan_timestamp DESC);
