import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/wallet.api.ts", () => ({
  exchangeApi: vi.fn(),
  getWalletApi: vi.fn().mockResolvedValue({
    wallet_id: "w-1",
    total_in_usd: 1000,
    balances: [
      { currency: "USD", currency_name: "Dólar", symbol: "$", amount: "1000.00" },
      { currency: "ARS", currency_name: "Peso", symbol: "$", amount: "50000.00" },
    ],
  }),
  getWalletTransactionsApi: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../api/rates.api.ts", () => ({
  getExchangeRateQuoteApi: vi.fn().mockResolvedValue({
    from: "USD",
    to: "ARS",
    rate: 1050,
  }),
}));

import { exchangeApi } from "../../api/wallet.api.ts";
import ExchangePage from "./ExchangePage.tsx";

const exchangeApiMock = vi.mocked(exchangeApi);

function renderExchange() {
  return render(
    <MemoryRouter initialEntries={["/exchange"]}>
      <Routes>
        <Route path="/exchange" element={<ExchangePage />} />
        <Route path="/dashboard" element={<p>Dashboard Mock</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ExchangePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rechaza si ambas monedas seleccionadas son idénticas", async () => {
    const user = userEvent.setup();
    renderExchange();

    // Set to_currency to USD as well
    const toSelect = screen.getByLabelText("Moneda de destino");
    await user.selectOptions(toSelect, "USD");

    await user.type(screen.getByLabelText(/Monto a cambiar/i), "100");
    await user.click(screen.getByRole("button", { name: "Cambiar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Elige dos monedas distintas.",
    );
    expect(exchangeApiMock).not.toHaveBeenCalled();
  });

  it("invierte las monedas seleccionadas al presionar el botón de swap", async () => {
    const user = userEvent.setup();
    renderExchange();

    const fromSelect = screen.getByLabelText("Moneda de origen") as HTMLSelectElement;
    const toSelect = screen.getByLabelText("Moneda de destino") as HTMLSelectElement;

    expect(fromSelect.value).toBe("USD");
    expect(toSelect.value).toBe("ARS");

    await user.click(screen.getByRole("button", { name: "Invertir monedas" }));

    expect(fromSelect.value).toBe("ARS");
    expect(toSelect.value).toBe("USD");
  });

  it("no ejecuta el cambio si el usuario cancela en el modal de confirmación", async () => {
    const user = userEvent.setup();
    renderExchange();

    await user.type(screen.getByLabelText(/Monto a cambiar/i), "50");
    await user.click(screen.getByRole("button", { name: "Cambiar" }));

    // Modal is shown
    expect(screen.getByText("Confirmar cambio de moneda")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver" }));

    expect(exchangeApiMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Confirmar cambio de moneda")).not.toBeInTheDocument();
  });

  it("muestra error si la API rechaza el cambio por saldo insuficiente tras confirmar", async () => {
    const user = userEvent.setup();
    exchangeApiMock.mockRejectedValueOnce(new Error("Saldo insuficiente"));
    renderExchange();

    await user.type(screen.getByLabelText(/Monto a cambiar/i), "500");
    await user.click(screen.getByRole("button", { name: "Cambiar" }));

    // Confirm in modal
    await user.click(screen.getByRole("button", { name: "Confirmar cambio" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Saldo insuficiente");
  });

  it("muestra la tasa de cotización en vivo antes de la transacción", async () => {
    renderExchange();
    expect(
      await screen.findByText(/1 USD = 1\.050,00 ARS/),
    ).toBeInTheDocument();
  });

  it("ejecuta el cambio con éxito y muestra el comprobante persistente con tasa y monto recibido", async () => {
    const user = userEvent.setup();
    exchangeApiMock.mockResolvedValueOnce({
      id: "tx-swap-123",
      type: "SWAP",
      to_amount: "48500",
      to_currency: "ARS",
      applied_exchange_rate: "1050.25",
    } as unknown as Awaited<ReturnType<typeof exchangeApi>>);
    renderExchange();

    await user.type(screen.getByLabelText(/Monto a cambiar/i), "50");
    await user.click(screen.getByRole("button", { name: "Cambiar" }));

    // Modal breakdown
    expect(screen.getByText("Confirmar cambio de moneda")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar cambio" }));

    expect(exchangeApiMock).toHaveBeenCalledWith("USD", "ARS", 50);
    expect(
      await screen.findByText(/¡Cambio realizado con éxito!/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/48\.500,00 ARS/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 USD = 1\.050,25 ARS/),
    ).toBeInTheDocument();
    expect(screen.getByText("tx-swap-123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir al panel principal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hacer otro cambio" })).toBeInTheDocument();
  });

  it("respeta el parámetro ?from de la URL", () => {
    render(
      <MemoryRouter initialEntries={["/exchange?from=EUR"]}>
        <Routes>
          <Route path="/exchange" element={<ExchangePage />} />
        </Routes>
      </MemoryRouter>,
    );

    const fromSelect = screen.getByLabelText("Moneda de origen") as HTMLSelectElement;
    expect(fromSelect.value).toBe("EUR");
  });
});
