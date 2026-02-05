import { nanoid } from 'nanoid'

export async function onRequestPost({ request, env }) {
  const form = await request.formData()
  const file = form.get('file')
  if (!file) return new Response('No file', { status: 400 })

  const id = nanoid(8)
  const ext = file.name.split('.').pop()
  const name = `${id}.${ext}`

  await env.BUCKET.put(name, file.stream(), {
    httpMetadata: { contentType: file.type }
  })

  const url = `https://${env.PUBLIC_DOMAIN}/${name}`

  await env.DB.put(id, JSON.stringify({
    name,
    url,
    size: file.size,
    type: file.type,
    time: Date.now()
  }))

  return new Response(
    JSON.stringify({ success: true, url }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
