import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseWallet = vi.fn();

vi.mock("../../hooks/useWallet.ts", () => ({
  useWallet: () => mockUseWallet(),
}));

import HistorialPage from "./HistorialPage.tsx";

function renderHistorial() {
  return render(
    <MemoryRouter initialEntries={["/historial"]}>
      <Routes>
        <Route path="/historial" element={<HistorialPage />} />
        <Route path="/dashboard" element={<p>Dashboard Mock</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HistorialPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra estado de carga mientras obtiene transacciones", () => {
    mockUseWallet.mockReturnValue({
      transactions: [],
      transactionsLoading: true,
      transactionsError: null,
    });

    renderHistorial();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });

  it("muestra mensaje de error si falla la carga", () => {
    mockUseWallet.mockReturnValue({
      transactions: [],
      transactionsLoading: false,
      transactionsError: "Fallo de conexión",
    });

    renderHistorial();
    expect(
      screen.getByText(/No se pudo cargar tu historial: Fallo de conexión/),
    ).toBeInTheDocument();
  });

  it("muestra estado vacío cuando no hay transacciones", () => {
    mockUseWallet.mockReturnValue({
      transactions: [],
      transactionsLoading: false,
      transactionsError: null,
    });

    renderHistorial();
    expect(
      screen.getByText("Todavía no hiciste ninguna transacción."),
    ).toBeInTheDocument();
  });

  it("renderiza transacciones de transferencia con contraparte e historial de swap", () => {
    mockUseWallet.mockReturnValue({
      transactions: [
        {
          id: "tx-1",
          type: "TRANSFER",
          direction: "sent",
          from_currency: "USD",
          from_amount: 30,
          counterparty_username: "amigo1",
          created_at: "2026-09-04T12:00:00Z",
        },
        {
          id: "tx-2",
          type: "TRANSFER",
          direction: "received",
          to_currency: "USD",
          to_amount: 45,
          counterparty_username: "amigo2",
          created_at: "2026-09-04T13:00:00Z",
        },
        {
          id: "tx-3",
          type: "SWAP",
          direction: "sent",
          from_currency: "USD",
          to_currency: "EUR",
          from_amount: 100,
          to_amount: 90,
          applied_exchange_rate: "0.9000",
          created_at: "2026-09-04T14:00:00Z",
        },
      ],
      transactionsLoading: false,
      transactionsError: null,
    });

    renderHistorial();

    expect(screen.getByText("Enviado a @amigo1")).toBeInTheDocument();
    expect(screen.getByText("Recibido de @amigo2")).toBeInTheDocument();
    expect(screen.getByText(/USD → EUR • Tasa: 0,9/)).toBeInTheDocument();
  });

  it("navega al dashboard al presionar el botón Volver", async () => {
    const user = userEvent.setup();
    mockUseWallet.mockReturnValue({
      transactions: [],
      transactionsLoading: false,
      transactionsError: null,
    });

    renderHistorial();

    await user.click(screen.getByRole("button", { name: "Volver" }));
    expect(await screen.findByText("Dashboard Mock")).toBeInTheDocument();
  });
});
