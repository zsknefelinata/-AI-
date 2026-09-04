import { createApp } from './app'

const port = Number(process.env.PORT || 3001)

createApp().listen(port, () => {
  console.log(`Road AI Maintenance Server listening on http://localhost:${port}`)
})
