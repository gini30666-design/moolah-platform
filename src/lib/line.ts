const LINE_API = 'https://api.line.me/v2/bot/message'
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!

export async function pushMessage(to: string, text: string) {
  await fetch(`${LINE_API}/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      to,
      messages: [{ type: 'text', text }],
    }),
  })
}

export async function multicastMessage(userIds: string[], text: string) {
  await fetch(`${LINE_API}/multicast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      to: userIds,
      messages: [{ type: 'text', text }],
    }),
  })
}
