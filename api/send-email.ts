import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const sesClient = new SESClient({ region: process.env.AWS_REGION })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const secret = req.headers['x-email-api-secret']
  if (!secret || secret !== process.env.EMAIL_API_SECRET) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const { to, subject, html, text } = req.body ?? {}

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ error: 'Faltan datos: to, subject y html o text son requeridos' })
  }

  try {
    const command = new SendEmailCommand({
      Source: process.env.SES_FROM_EMAIL,
      Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          ...(html ? { Html: { Data: html, Charset: 'UTF-8' } } : {}),
          ...(text ? { Text: { Data: text, Charset: 'UTF-8' } } : {}),
        },
      },
    })

    await sesClient.send(command)
    res.status(200).json({ sent: true })
  } catch (error) {
    console.error('Error enviando email con SES:', error)
    res.status(500).json({ error: 'No se pudo enviar el email' })
  }
}