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

  it("no ejecuta la transferencia si el usuario cancela en el modal de confirmación", async () => {
    const user = userEvent.setup();
    renderTransfer();

    await user.type(screen.getByLabelText("Nombre de usuario del destinatario"), "camilo");
    await user.type(screen.getByLabelText("Monto"), "50");
    await user.click(screen.getByRole("button", { name: "Enviar dinero" }));

    expect(screen.getByText("Confirmar transferencia")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver" }));

    expect(transferApiMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Confirmar transferencia")).not.toBeInTheDocument();
  });

  it("muestra error devuelto por la API cuando falla la transferencia tras confirmar", async () => {
    const user = userEvent.setup();
    transferApiMock.mockRejectedValueOnce(new Error("Saldo insuficiente"));
    renderTransfer();

    await user.type(screen.getByLabelText("Nombre de usuario del destinatario"), "camilo");
    await user.type(screen.getByLabelText("Monto"), "100");
    await user.click(screen.getByRole("button", { name: "Enviar dinero" }));

    expect(screen.getByText("Confirmar transferencia")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar envío" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Saldo insuficiente");
  });

  it("procesa la transferencia con éxito y muestra comprobante persistente con destinatario y nota", async () => {
    const user = userEvent.setup();
    transferApiMock.mockResolvedValueOnce({
      id: "tx-transfer-789",
      type: "TRANSFER",
    } as unknown as Awaited<ReturnType<typeof transferApi>>);
    renderTransfer();

    await user.type(screen.getByLabelText("Nombre de usuario del destinatario"), "camilo");
    await user.type(screen.getByLabelText("Monto"), "25");
    await user.type(screen.getByLabelText("Nota o motivo (opcional)"), "Cena del viaje");
    await user.click(screen.getByRole("button", { name: "Enviar dinero" }));

    expect(screen.getByText("Confirmar transferencia")).toBeInTheDocument();
    expect(screen.getByText("@camilo")).toBeInTheDocument();
    expect(screen.getByText("Cena del viaje")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar envío" }));

    expect(transferApiMock).toHaveBeenCalledWith("camilo", "USD", 25, "Cena del viaje");
    expect(
      await screen.findByText(/¡Transferencia exitosa!/i),
    ).toBeInTheDocument();
    expect(screen.getByText("tx-transfer-789")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir al panel principal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar otra transferencia" })).toBeInTheDocument();
  });

  it("respeta el parámetro ?currency de la URL", () => {
    render(
      <MemoryRouter initialEntries={["/transfer?currency=EUR"]}>
        <Routes>
          <Route path="/transfer" element={<TransferPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const select = screen.getByLabelText("Moneda") as HTMLSelectElement;
    expect(select.value).toBe("EUR");
  });
});
