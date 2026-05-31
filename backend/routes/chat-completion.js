const express        = require('express')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// ── Config ────────────────────────────────────────────────────────────────────
const GROQ_URL    = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.1-8b-instant'

// Allowed Groq models. We map your old Ollama model names to Groq equivalents
// so the frontend dropdown keeps working without changes.
const MODEL_MAP = {
  'llama3.2':            'llama-3.1-8b-instant',   // fast
  'llama3.1':            'llama-3.3-70b-versatile', // smart
  'llama-3.1-8b-instant':  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile': 'llama-3.3-70b-versatile',
}

// ── POST /api/chat/completion ─────────────────────────────────────────────────
//
// Body: { messages: [{role, content}, ...], model?: string, systemPrompt?: string }
// Streams back the model's response as Server-Sent Events (SSE).
//
router.post('/completion', authMiddleware, async (req, res) => {
  try {
    const { messages, model: requestedModel, systemPrompt } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: '`messages` must be a non-empty array.' })
    }
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set')
      return res.status(500).json({ message: 'AI service is not configured on the server.' })
    }

    // Resolve the model — fall back to default if unknown
    const model = MODEL_MAP[requestedModel] || DEFAULT_MODEL

    // Build the messages array Groq expects (OpenAI-compatible format)
    const fullMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages

    // Set up Server-Sent Events headers BEFORE we start streaming
    res.setHeader('Content-Type',  'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection',    'keep-alive')
    // Disable nginx buffering on platforms like Render
    res.setHeader('X-Accel-Buffering', 'no')

    // Call Groq with streaming enabled
    const upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model,
        messages:    fullMessages,
        stream:      true,
        temperature: 0.7,
        max_tokens:  1024,
      }),
    })

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '')
      console.error('Groq error:', upstream.status, errText)
      // We've already started SSE headers, so send an error event and end
      res.write(`event: error\ndata: ${JSON.stringify({
        message: `AI provider error (${upstream.status}). Please try again.`,
      })}\n\n`)
      return res.end()
    }

    // Stream chunks from Groq → client, converting OpenAI SSE format
    // into a simpler { token } payload the frontend can append.
    const reader  = upstream.body.getReader()
    const decoder = new TextDecoder()
    let buffer    = ''

    // Detect client disconnect so we stop wasting Groq tokens
    let aborted = false
    req.on('close', () => { aborted = true })

    while (true) {
      if (aborted) {
        try { await reader.cancel() } catch { /* ignore */ }
        break
      }

      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // SSE messages are separated by blank lines
      const lines = buffer.split('\n')
      buffer = lines.pop() // keep the (possibly incomplete) last line

      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (payload === '[DONE]') {
          res.write(`event: done\ndata: {}\n\n`)
          return res.end()
        }
        try {
          const json  = JSON.parse(payload)
          const token = json.choices?.[0]?.delta?.content
          if (token) {
            res.write(`data: ${JSON.stringify({ token })}\n\n`)
          }
        } catch {
          /* malformed chunk — skip */
        }
      }
    }

    res.write(`event: done\ndata: {}\n\n`)
    res.end()
  } catch (err) {
    console.error('Completion route error:', err)
    if (!res.headersSent) {
      return res.status(500).json({ message: 'AI request failed. Please try again.' })
    }
    res.write(`event: error\ndata: ${JSON.stringify({ message: 'AI request failed.' })}\n\n`)
    res.end()
  }
})

module.exports = router