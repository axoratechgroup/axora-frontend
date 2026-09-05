import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./fetchWithAuth.ts", () => ({
  fetchWithAuth: vi.fn(),
}));

import { fetchWithAuth } from "./fetchWithAuth.ts";
import {
  getWalletApi,
  getWalletTransactionsApi,
  topupApi,
  transferApi,
  exchangeApi,
} from "./wallet.api.ts";

const fetchWithAuthMock = vi.mocked(fetchWithAuth);

describe("wallet.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWalletApi", () => {
    it("retorna los datos de la wallet si la respuesta es exitosa", async () => {
      const mockData = {
        wallet_id: "w-1",
        created_at: "2026-09-01",
        balances: [{ currency: "USD", amount: 100 }],
      };
      fetchWithAuthMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), { status: 200 }),
      );

      const result = await getWalletApi();
      expect(result).toEqual(mockData);
      expect(fetchWithAuthMock).toHaveBeenCalledWith(
        expect.stringContaining("/wallet"),
      );
    });

    it("lanza un error con el mensaje devuelto por la API en caso de fallo", async () => {
      fetchWithAuthMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Token inválido" }), { status: 401 }),
      );

      await expect(getWalletApi()).rejects.toThrow("Token inválido");
    });
  });

  describe("getWalletTransactionsApi", () => {
    it("retorna el array de transacciones", async () => {
      const mockTransactions = [{ id: "tx-1", type: "TOP_UP" }];
      fetchWithAuthMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ transactions: mockTransactions }), {
          status: 200,
        }),
      );

      const result = await getWalletTransactionsApi();
      expect(result).toEqual(mockTransactions);
    });
  });

  describe("topupApi", () => {
    it("envía el payload correspondiente y retorna la transacción creada", async () => {
      const mockTx = { id: "tx-topup", type: "TOP_UP", to_amount: 50 };
      fetchWithAuthMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ transaction: mockTx }), { status: 200 }),
      );

      const result = await topupApi("USD", 50);
      expect(result).toEqual(mockTx);
      expect(fetchWithAuthMock).toHaveBeenCalledWith(
        expect.stringContaining("/wallet/topup"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currency: "USD", amount: 50 }),
        },
      );
    });
  });

  describe("transferApi", () => {
    it("envía destinatario, moneda y monto a /wallet/transfer", async () => {
      const mockTx = { id: "tx-tr", type: "TRANSFER" };
      fetchWithAuthMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ transaction: mockTx }), { status: 200 }),
      );

      const result = await transferApi("camilo", "USD", 30);
      expect(result).toEqual(mockTx);
      expect(fetchWithAuthMock).toHaveBeenCalledWith(
        expect.stringContaining("/wallet/transfer"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient_username: "camilo",
            currency: "USD",
            amount: 30,
          }),
        },
      );
    });
  });

  describe("exchangeApi", () => {
    it("envía from_currency, to_currency y monto a /wallet/exchange", async () => {
      const mockTx = { id: "tx-ex", type: "SWAP" };
      fetchWithAuthMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ transaction: mockTx }), { status: 200 }),
      );

      const result = await exchangeApi("USD", "ARS", 100);
      expect(result).toEqual(mockTx);
      expect(fetchWithAuthMock).toHaveBeenCalledWith(
        expect.stringContaining("/wallet/exchange"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from_currency: "USD",
            to_currency: "ARS",
            amount: 100,
          }),
        },
      );
    });
  });
});
