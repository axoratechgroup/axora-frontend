import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./fetchWithAuth.ts", () => ({
  fetchWithAuth: vi.fn(),
}));

import { fetchWithAuth } from "./fetchWithAuth.ts";
import { sendChatMessageApi, confirmChatActionApi } from "./chat.api.ts";

const fetchWithAuthMock = vi.mocked(fetchWithAuth);

describe("chat.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendChatMessageApi", () => {
    it("envía el mensaje y el historial a /chat y retorna la respuesta", async () => {
      const mockResponse = {
        reply: "Hola, te puedo ayudar.",
      };
      fetchWithAuthMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const result = await sendChatMessageApi("Hola", []);
      expect(result).toEqual(mockResponse);
      expect(fetchWithAuthMock).toHaveBeenCalledWith(
        expect.stringContaining("/chat"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Hola", history: [] }),
        },
      );
    });

    it("lanza un error si el backend responde con error", async () => {
      fetchWithAuthMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Fallo en Gemini" }), { status: 500 }),
      );

      await expect(sendChatMessageApi("Hola", [])).rejects.toThrow(
        "Fallo en Gemini",
      );
    });
  });

  describe("confirmChatActionApi", () => {
    it("envía la acción propuesta a /chat/confirm y retorna confirmación", async () => {
      const action = {
        type: "transfer" as const,
        params: { recipient_username: "camilo", currency: "USD", amount: 10 },
      };
      const mockResponse = {
        reply: "Transferencia confirmada.",
      };
      fetchWithAuthMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const result = await confirmChatActionApi(action);
      expect(result).toEqual(mockResponse);
      expect(fetchWithAuthMock).toHaveBeenCalledWith(
        expect.stringContaining("/chat/confirm"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        },
      );
    });
  });
});
