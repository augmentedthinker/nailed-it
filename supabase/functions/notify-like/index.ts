import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const authorization = request.headers.get('Authorization') || ''
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } } })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return new Response('Unauthorized', { status: 401, headers: cors })

    const { postId } = await request.json()
    if (!postId) return new Response('Missing postId', { status: 400, headers: cors })
    const admin = createClient(url, service)
    const { data: like } = await admin.from('likes').select('post_id').eq('post_id', postId).eq('user_id', user.id).maybeSingle()
    if (!like) return new Response('Like not found', { status: 403, headers: cors })
    const { data: post, error: postError } = await admin.from('posts').select('user_id,caption').eq('id', postId).single()
    if (postError) throw postError
    if (post.user_id === user.id) return Response.json({ sent: 0, reason: 'self-like' }, { headers: cors })

    const [{ data: liker }, { data: devices }] = await Promise.all([
      admin.from('profiles').select('display_name').eq('id', user.id).single(),
      admin.from('push_subscriptions').select('id,endpoint,p256dh,auth').eq('user_id', post.user_id),
    ])
    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT')!,
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!,
    )
    const payload = JSON.stringify({
      title: 'New love on Nailed It! 💗',
      body: `${liker?.display_name || 'Someone'} liked your fresh set.`,
      tag: `like-${postId}-${user.id}`,
      url: '/',
    })
    let sent = 0
    for (const device of devices || []) {
      try {
        await webpush.sendNotification({ endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } }, payload)
        sent++
      } catch (error) {
        if (error?.statusCode === 404 || error?.statusCode === 410) await admin.from('push_subscriptions').delete().eq('id', device.id)
        else console.error('Push failed', error)
      }
    }
    return Response.json({ sent }, { headers: cors })
  } catch (error) {
    console.error(error)
    return Response.json({ error: error.message }, { status: 500, headers: cors })
  }
})
