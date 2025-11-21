-- Fix 1: Add RLS policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Modify handle_new_user to make first user an admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  role_to_assign app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  
  -- Check if this is the first user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id != NEW.id) THEN
    role_to_assign := 'admin';
  ELSE
    role_to_assign := 'user';
  END IF;
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, role_to_assign);
  
  RETURN NEW;
END;
$function$;