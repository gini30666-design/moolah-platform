import { google } from 'googleapis'
import { Readable } from 'stream'

const driveAuth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
})

const drive = google.drive({ version: 'v3', auth: driveAuth })

export async function uploadImageToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const stream = Readable.from(buffer)

  const PORTFOLIO_FOLDER = '1az6PGzoeTVM0wJJ5Q0lQv9achsjZ18g7'

  const res = await drive.files.create({
    requestBody: { name: filename, mimeType, parents: [PORTFOLIO_FOLDER] },
    media: { mimeType, body: stream },
    fields: 'id',
  })

  const fileId = res.data.id!

  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  })

  return `https://drive.google.com/uc?export=view&id=${fileId}`
}
