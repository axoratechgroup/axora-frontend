import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const { sendMock, commandMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  commandMock: vi.fn(),
}))

vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: class {
    send = sendMock
  },
  SendEmailCommand: class {
    input: unknown

    constructor(input: unknown) {
      this.input = input
      commandMock(input)
    }
  },
}))

import handler from './send-email.ts'

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  }
  response.status.mockReturnValue(response)
  return response
}

function createRequest(overrides: Partial<VercelRequest> = {}) {
  return {
    method: 'POST',
    headers: { 'x-email-api-secret': 'test-secret' },
    body: {
      to: 'ana@axora.test',
      subject: 'Movimiento confirmado',
      html: '<p>Contenido</p>',
      text: 'Contenido',
    },
    ...overrides,
  } as VercelRequest
}

describe('send-email Vercel Function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.AWS_REGION = 'us-east-1'
    process.env.SES_FROM_EMAIL = 'notificaciones@axora.test'
    process.env.EMAIL_API_SECRET = 'test-secret'
  })

  it('rechaza métodos distintos de POST', async () => {
    const response = createResponse()

    await handler(createRequest({ method: 'GET' }), response as unknown as VercelResponse)

    expect(response.status).toHaveBeenCalledWith(405)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rechaza solicitudes sin el secreto compartido', async () => {
    const response = createResponse()

    await handler(createRequest({ headers: {} }), response as unknown as VercelResponse)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rechaza un destinatario con formato inválido', async () => {
    const response = createResponse()

    await handler(
      createRequest({ body: { to: 'correo-invalido', subject: 'Asunto', text: 'Contenido' } }),
      response as unknown as VercelResponse,
    )

    expect(response.status).toHaveBeenCalledWith(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('envía el correo mediante SES con datos válidos', async () => {
    const response = createResponse()
    sendMock.mockResolvedValueOnce({ MessageId: 'ses-message-id' })

    await handler(createRequest(), response as unknown as VercelResponse)

    expect(commandMock).toHaveBeenCalledWith(
      expect.objectContaining({
        Source: 'notificaciones@axora.test',
        Destination: { ToAddresses: ['ana@axora.test'] },
      }),
    )
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ sent: true })
  })

  it('devuelve 500 si SES falla', async () => {
    const response = createResponse()
    sendMock.mockRejectedValueOnce(new Error('SES unavailable'))

    await handler(createRequest(), response as unknown as VercelResponse)

    expect(response.status).toHaveBeenCalledWith(500)
    expect(response.json).toHaveBeenCalledWith({ error: 'No se pudo enviar el email' })
  })
})
