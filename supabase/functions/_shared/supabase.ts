import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const createClients = (req: Request) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const authHeader = req.headers.get('Authorization') ?? ''

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  })

  const serviceClient = createClient(supabaseUrl, serviceRoleKey)

  return { userClient, serviceClient }
}

export const requireUser = async (req: Request) => {
  const { userClient, serviceClient } = createClients(req)
  const { data, error } = await userClient.auth.getUser()

  if (error || !data.user) {
    return { user: null, userClient, serviceClient }
  }

  return { user: data.user, userClient, serviceClient }
}
