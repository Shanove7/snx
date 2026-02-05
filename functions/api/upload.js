export async function onRequestPost({ request, env }) {
  const form = await request.formData()
  const file = form.get('file')

  if (!file) {
    return new Response('No file', { status: 400 })
  }

  // ID TANPA DEPENDENCY (AMAN DI PAGES)
  const id = crypto.randomUUID().slice(0, 8)
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
  const name = `${id}.${ext}`

  // Upload ke R2
  await env.BUCKET.put(name, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' }
  })

  const url = `https://${env.PUBLIC_DOMAIN}/${name}`

  // Simpan metadata ke KV (DB, TIDAK RESET)
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
