import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/wallet.api.ts", () => ({
  exchangeApi: vi.fn(),
  getWalletApi: vi.fn().mockResolvedValue({
    wallet_id: "w-1",
    created_at: "",
    total_in_usd: 1000,
    balances: [
      { currency: "USD", currency_name: "Dólar", symbol: "$", amount: "1000.00", updated_at: "" },
      { currency: "ARS", currency_name: "Peso", symbol: "$", amount: "50000.00", updated_at: "" },
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

import { exchangeApi, getWalletApi } from "../../api/wallet.api.ts";
import ExchangePage from "./ExchangePage.tsx";

const exchangeApiMock = vi.mocked(exchangeApi);
const getWalletApiMock = vi.mocked(getWalletApi);

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
    getWalletApiMock.mockResolvedValue({
      wallet_id: "w-1",
      created_at: "",
      total_in_usd: 1000,
      balances: [
        { currency: "USD", currency_name: "Dólar", symbol: "$", amount: "1000.00", updated_at: "" },
        { currency: "ARS", currency_name: "Peso", symbol: "$", amount: "50000.00", updated_at: "" },
      ],
    });
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
    expect(screen.getByText("Elige dos monedas distintas.")).toBeInTheDocument();

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

  it("bloquea en el frontend si el monto a cambiar supera el saldo disponible", async () => {
    const user = userEvent.setup();
    renderExchange();

    await screen.findByText(/1\.000,00 USD/);

    await user.type(screen.getByLabelText(/Monto a cambiar/i), "1500");
    await user.click(screen.getByRole("button", { name: "Cambiar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Saldo insuficiente. Tu saldo disponible es de 1.000,00 USD.",
    );
    expect(exchangeApiMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Confirmar cambio de moneda")).not.toBeInTheDocument();
  });

  it("actualiza el saldo disponible tras convertir divisas y muestra 0,00 al hacer otro cambio", async () => {
    const user = userEvent.setup();

    // Mock initial load (1000 USD), and next load after exchange (0 USD)
    getWalletApiMock
      .mockResolvedValueOnce({
        wallet_id: "w-1",
        created_at: "",
        total_in_usd: 1000,
        balances: [
          { currency: "USD", currency_name: "Dólar", symbol: "$", amount: "1000.00", updated_at: "" },
          { currency: "ARS", currency_name: "Peso", symbol: "$", amount: "50000.00", updated_at: "" },
        ],
      })
      .mockResolvedValueOnce({
        wallet_id: "w-1",
        created_at: "",
        total_in_usd: 1000,
        balances: [
          { currency: "USD", currency_name: "Dólar", symbol: "$", amount: "0.00", updated_at: "" },
          { currency: "ARS", currency_name: "Peso", symbol: "$", amount: "1098500.00", updated_at: "" },
        ],
      });

    exchangeApiMock.mockResolvedValueOnce({
      id: "tx-all-dollars",
      type: "SWAP",
      to_amount: "1048500",
      to_currency: "ARS",
      applied_exchange_rate: "1050",
    } as unknown as Awaited<ReturnType<typeof exchangeApi>>);

    renderExchange();

    // Initial available balance is 1.000,00 USD
    expect(await screen.findByText(/1\.000,00 USD/)).toBeInTheDocument();

    // User exchanges all 1000 USD
    await user.type(screen.getByLabelText(/Monto a cambiar/i), "1000");
    await user.click(screen.getByRole("button", { name: "Cambiar" }));

    expect(screen.getByText("Confirmar cambio de moneda")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar cambio" }));

    // Receipt is displayed
    expect(await screen.findByText(/¡Cambio realizado con éxito!/i)).toBeInTheDocument();
    expect(screen.getByText("tx-all-dollars")).toBeInTheDocument();

    // User clicks "Hacer otro cambio"
    await user.click(screen.getByRole("button", { name: "Hacer otro cambio" }));

    // Now available balance must show 0,00 USD (not the old 1.000,00 USD)
    expect(await screen.findByText(/0,00 USD/)).toBeInTheDocument();

    // If user tries to operate again with USD, frontend immediately rejects
    await user.type(screen.getByLabelText(/Monto a cambiar/i), "100");
    await user.click(screen.getByRole("button", { name: "Cambiar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Saldo insuficiente. Tu saldo disponible es de 0,00 USD.",
    );
    expect(exchangeApiMock).toHaveBeenCalledTimes(1); // not called again
  });
});
