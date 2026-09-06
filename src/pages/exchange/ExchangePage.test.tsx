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
    const toSelect = screen.getByLabelText("A");
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

    const fromSelect = screen.getByLabelText("De") as HTMLSelectElement;
    const toSelect = screen.getByLabelText("A") as HTMLSelectElement;

    expect(fromSelect.value).toBe("USD");
    expect(toSelect.value).toBe("ARS");

    await user.click(screen.getByRole("button", { name: "Invertir monedas" }));

    expect(fromSelect.value).toBe("ARS");
    expect(toSelect.value).toBe("USD");
  });

  it("no ejecuta el cambio si el usuario cancela la alerta de confirmación", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    renderExchange();

    await user.type(screen.getByLabelText(/Monto a cambiar/i), "50");
    await user.click(screen.getByRole("button", { name: "Cambiar" }));

    expect(window.confirm).toHaveBeenCalled();
    expect(exchangeApiMock).not.toHaveBeenCalled();
  });

  it("muestra error si la API rechaza el cambio por saldo insuficiente", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    exchangeApiMock.mockRejectedValueOnce(new Error("Saldo insuficiente"));
    renderExchange();

    await user.type(screen.getByLabelText(/Monto a cambiar/i), "500");
    await user.click(screen.getByRole("button", { name: "Cambiar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Saldo insuficiente");
  });

  it("ejecuta el cambio con éxito y muestra el monto recibido", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    exchangeApiMock.mockResolvedValueOnce({
      id: "tx-swap",
      type: "SWAP",
      to_amount: "48500",
      to_currency: "ARS",
    } as any);
    renderExchange();

    await user.type(screen.getByLabelText(/Monto a cambiar/i), "50");
    await user.click(screen.getByRole("button", { name: "Cambiar" }));

    expect(exchangeApiMock).toHaveBeenCalledWith("USD", "ARS", 50);
    expect(
      await screen.findByText(/Cambio exitoso: recibiste 48500 ARS/),
    ).toBeInTheDocument();
  });
});
