-- Add location columns to users table
ALTER TABLE public.users 
ADD COLUMN latitude NUMERIC(10, 8),
ADD COLUMN longitude NUMERIC(11, 8),
ADD COLUMN location_city TEXT;

-- Add comments to describe the columns
COMMENT ON COLUMN public.users.latitude IS 'User location latitude coordinate';
COMMENT ON COLUMN public.users.longitude IS 'User location longitude coordinate';
COMMENT ON COLUMN public.users.location_city IS 'User city/location name for display';

-- Create a function to calculate distance between two points using Haversine formula
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  earth_radius NUMERIC := 6371; -- Earth radius in kilometers
  dlat NUMERIC;
  dlon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  -- Convert degrees to radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Haversine formula
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  -- Return distance in kilometers
  RETURN earth_radius * c;
END;
$$;