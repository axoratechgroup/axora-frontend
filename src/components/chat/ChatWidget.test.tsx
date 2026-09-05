import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/chat.api.ts", () => ({
  sendChatMessageApi: vi.fn(),
  confirmChatActionApi: vi.fn(),
}));

import { sendChatMessageApi, confirmChatActionApi } from "../../api/chat.api.ts";
import { ChatWidget } from "./ChatWidget.tsx";

const sendChatMessageApiMock = vi.mocked(sendChatMessageApi);
const confirmChatActionApiMock = vi.mocked(confirmChatActionApi);

describe("ChatWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("inicia cerrado y se abre al hacer clic en el botón flotante", async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /CHAT IA/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/Hola, soy el asistente de Axora/),
    ).toBeInTheDocument();
  });

  it("envía un mensaje del usuario y muestra la respuesta del asistente", async () => {
    const user = userEvent.setup();
    sendChatMessageApiMock.mockResolvedValueOnce({
      reply: "Puedo ayudarte a transferir fondos a **camilo**.",
    });

    render(<ChatWidget />);
    await user.click(screen.getByRole("button", { name: /CHAT IA/i }));

    const input = screen.getByPlaceholderText("Escribe tu mensaje…");
    await user.type(input, "¿Cómo transfiero dinero?{enter}");

    expect(screen.getByText("¿Cómo transfiero dinero?")).toBeInTheDocument();
    expect(sendChatMessageApiMock).toHaveBeenCalledWith(
      "¿Cómo transfiero dinero?",
      expect.any(Array),
    );
    expect(
      await screen.findByText(/Puedo ayudarte a transferir fondos a/),
    ).toBeInTheDocument();
  });

  it("renderiza botones de acción cuando el asistente propone una operación y permite confirmarla", async () => {
    const user = userEvent.setup();
    const onActionConfirmed = vi.fn();

    sendChatMessageApiMock.mockResolvedValueOnce({
      reply: "¿Confirmas la transferencia de 10 USD a camilo?",
      proposedAction: {
        type: "transfer",
        params: { recipient_username: "camilo", currency: "USD", amount: 10 },
      },
    });

    confirmChatActionApiMock.mockResolvedValueOnce({
      reply: "Transferencia de 10 USD a camilo realizada con éxito.",
    });

    render(<ChatWidget onActionConfirmed={onActionConfirmed} />);
    await user.click(screen.getByRole("button", { name: /CHAT IA/i }));

    const input = screen.getByPlaceholderText("Escribe tu mensaje…");
    await user.type(input, "Transfiere 10 USD a camilo{enter}");

    const confirmBtn = await screen.findByRole("button", { name: "Confirmar" });
    const cancelBtn = screen.getByRole("button", { name: "Cancelar" });

    expect(confirmBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();

    await user.click(confirmBtn);

    expect(confirmChatActionApiMock).toHaveBeenCalledWith({
      type: "transfer",
      params: { recipient_username: "camilo", currency: "USD", amount: 10 },
    });
    expect(await screen.findByText("✅ Confirmado")).toBeInTheDocument();
    expect(
      await screen.findByText("Transferencia de 10 USD a camilo realizada con éxito."),
    ).toBeInTheDocument();
    expect(onActionConfirmed).toHaveBeenCalledTimes(1);
  });

  it("permite cancelar una acción propuesta por el asistente", async () => {
    const user = userEvent.setup();

    sendChatMessageApiMock.mockResolvedValueOnce({
      reply: "¿Confirmas cargar 50 USD?",
      proposedAction: {
        type: "topup",
        params: { currency: "USD", amount: 50 },
      },
    });

    render(<ChatWidget />);
    await user.click(screen.getByRole("button", { name: /CHAT IA/i }));

    const input = screen.getByPlaceholderText("Escribe tu mensaje…");
    await user.type(input, "Quiero cargar 50 USD{enter}");

    const cancelBtn = await screen.findByRole("button", { name: "Cancelar" });
    await user.click(cancelBtn);

    expect(await screen.findByText("❌ Cancelado")).toBeInTheDocument();
    expect(
      screen.getByText("Listo, no hice ningún cambio."),
    ).toBeInTheDocument();
  });
});
