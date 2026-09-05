import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/wallet.api.ts", () => ({
  transferApi: vi.fn(),
}));

import { transferApi } from "../../api/wallet.api.ts";
import TransferPage from "./TransferPage.tsx";

const transferApiMock = vi.mocked(transferApi);

function renderTransfer() {
  return render(
    <MemoryRouter initialEntries={["/transfer"]}>
      <Routes>
        <Route path="/transfer" element={<TransferPage />} />
        <Route path="/dashboard" element={<p>Dashboard Mock</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("TransferPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra error si se envía sin destinatario", async () => {
    const user = userEvent.setup();
    renderTransfer();

    await user.click(screen.getByRole("button", { name: "Enviar dinero" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ingresa el nombre de usuario del destinatario.",
    );
    expect(transferApiMock).not.toHaveBeenCalled();
  });

  it("muestra error si el monto no es válido o es menor o igual a 0", async () => {
    const user = userEvent.setup();
    renderTransfer();

    await user.type(screen.getByLabelText("Nombre de usuario del destinatario"), "camilo");
    await user.type(screen.getByLabelText("Monto"), "0");
    await user.click(screen.getByRole("button", { name: "Enviar dinero" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ingresa un monto válido, mayor a 0.",
    );
    expect(transferApiMock).not.toHaveBeenCalled();
  });

  it("no ejecuta la transferencia si el usuario cancela la confirmación", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    renderTransfer();

    await user.type(screen.getByLabelText("Nombre de usuario del destinatario"), "camilo");
    await user.type(screen.getByLabelText("Monto"), "50");
    await user.click(screen.getByRole("button", { name: "Enviar dinero" }));

    expect(window.confirm).toHaveBeenCalled();
    expect(transferApiMock).not.toHaveBeenCalled();
  });

  it("muestra error devuelto por la API cuando falla la transferencia", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    transferApiMock.mockRejectedValueOnce(new Error("Saldo insuficiente"));
    renderTransfer();

    await user.type(screen.getByLabelText("Nombre de usuario del destinatario"), "camilo");
    await user.type(screen.getByLabelText("Monto"), "100");
    await user.click(screen.getByRole("button", { name: "Enviar dinero" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Saldo insuficiente");
  });

  it("procesa la transferencia con éxito y muestra confirmación", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    transferApiMock.mockResolvedValueOnce({
      id: "tx-1",
      type: "TRANSFER",
    } as any);
    renderTransfer();

    await user.type(screen.getByLabelText("Nombre de usuario del destinatario"), "camilo");
    await user.type(screen.getByLabelText("Monto"), "25");
    await user.click(screen.getByRole("button", { name: "Enviar dinero" }));

    expect(transferApiMock).toHaveBeenCalledWith("camilo", "USD", 25);
    expect(
      await screen.findByText(/Transferencia exitosa/i),
    ).toBeInTheDocument();
  });
});
