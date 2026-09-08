import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/wallet.api.ts", () => ({
  topupApi: vi.fn(),
}));

vi.mock("../../api/rates.api.ts", () => ({
  getExchangeRateQuoteApi: vi.fn(),
}));

import { topupApi } from "../../api/wallet.api.ts";
import { getExchangeRateQuoteApi } from "../../api/rates.api.ts";
import TopUpPage from "./TopUpPage.tsx";

const topupApiMock = vi.mocked(topupApi);
const getExchangeRateQuoteApiMock = vi.mocked(getExchangeRateQuoteApi);

function renderTopUp(initialEntry = "/topup") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/topup" element={<TopUpPage />} />
        <Route path="/dashboard" element={<p>Dashboard Mock</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("TopUpPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra error si el monto es inválido o menor a 0", async () => {
    const user = userEvent.setup();
    renderTopUp();

    await user.click(screen.getByRole("button", { name: "Cargar saldo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ingresa un monto válido, mayor a 0.",
    );
    expect(topupApiMock).not.toHaveBeenCalled();
  });

  it("no ejecuta la carga si se cancela en el modal de confirmación", async () => {
    const user = userEvent.setup();
    renderTopUp();

    await user.type(screen.getByLabelText("Monto"), "100");
    await user.click(screen.getByRole("button", { name: "Cargar saldo" }));

    expect(screen.getByText("Confirmar carga de saldo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver" }));

    expect(topupApiMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Confirmar carga de saldo")).not.toBeInTheDocument();
  });

  it("muestra error si la API rechaza la carga (ej. límite de USD superado)", async () => {
    const user = userEvent.setup();
    topupApiMock.mockRejectedValueOnce(
      new Error("superarías el límite de USD 10000 en tu cuenta"),
    );
    renderTopUp();

    await user.type(screen.getByLabelText("Monto"), "1000");
    await user.click(screen.getByRole("button", { name: "Cargar saldo" }));

    await user.click(screen.getByRole("button", { name: "Confirmar carga" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "superarías el límite de USD 10000",
    );
  });

  it("procesa la carga exitosamente y muestra comprobante persistente", async () => {
    const user = userEvent.setup();
    topupApiMock.mockResolvedValueOnce({
      id: "tx-topup-456",
      type: "TOP_UP",
    } as unknown as Awaited<ReturnType<typeof topupApi>>);
    renderTopUp();

    await user.type(screen.getByLabelText("Monto"), "50");
    await user.click(screen.getByRole("button", { name: "Cargar saldo" }));

    expect(screen.getByText("Confirmar carga de saldo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar carga" }));

    expect(topupApiMock).toHaveBeenCalledWith(expect.any(String), 50);
    expect(
      await screen.findByText(/¡Carga completada!/i),
    ).toBeInTheDocument();
    expect(screen.getByText("tx-topup-456")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir al panel principal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cargar más saldo" })).toBeInTheDocument();
  });

  it("respeta el parámetro ?currency de la URL", () => {
    renderTopUp("/topup?currency=EUR");

    const select = screen.getByLabelText("Moneda") as HTMLSelectElement;
    expect(select.value).toBe("EUR");
  });

  it("muestra la tasa de referencia USD y la equivalencia aproximada al recargar en otra divisa", async () => {
    const user = userEvent.setup();
    getExchangeRateQuoteApiMock.mockResolvedValueOnce({
      from_currency: "USD",
      to_currency: "COP",
      rate: 4000,
    });
    topupApiMock.mockResolvedValueOnce({
      id: "tx-topup-cop-123",
      type: "TOP_UP",
    } as unknown as Awaited<ReturnType<typeof topupApi>>);

    renderTopUp("/topup?currency=COP");

    // Banner de tasa de referencia
    expect(
      (await screen.findAllByText(/1 USD ≈ 4\.000/i)).length,
    ).toBeGreaterThanOrEqual(1);

    // Al ingresar un monto en COP
    await user.type(screen.getByLabelText("Monto"), "40000");

    // Caja de desglose
    expect(screen.getByText(/Equivalente aprox\. en USD:/i)).toBeInTheDocument();
    expect(screen.getByText(/≈ \$10,00 USD/i)).toBeInTheDocument();

    // Abrir modal de confirmación
    await user.click(screen.getByRole("button", { name: "Cargar saldo" }));
    expect(screen.getByText("Confirmar carga de saldo")).toBeInTheDocument();
    expect(screen.getAllByText(/1 USD ≈ 4\.000/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/≈ \$10,00 USD/i).length).toBeGreaterThanOrEqual(1);

    // Confirmar carga
    await user.click(screen.getByRole("button", { name: "Confirmar carga" }));

    // Comprobante
    expect(await screen.findByText(/¡Carga completada!/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1 USD ≈ 4\.000/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/≈ \$10,00 USD/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("tx-topup-cop-123")).toBeInTheDocument();
  });

  it("no muestra banner de tasa de referencia cuando la moneda seleccionada es USD", () => {
    renderTopUp("/topup?currency=USD");

    expect(screen.queryByText(/Tasa de referencia \(USD\):/i)).not.toBeInTheDocument();
  });
});
