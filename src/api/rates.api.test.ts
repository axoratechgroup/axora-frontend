import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getExchangeRateQuoteApi, getRateHistoryApi } from "./rates.api.ts";

describe("rates.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getExchangeRateQuoteApi", () => {
    it("retorna tasa 1 inmediatamente sin fetch si ambas monedas son idénticas", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const result = await getExchangeRateQuoteApi("USD", "USD");
      expect(result).toEqual({ from_currency: "USD", to_currency: "USD", rate: 1 });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("consulta /rates/quote y retorna la cotización correctamente", async () => {
      const mockData = {
        from_currency: "USD",
        to_currency: "ARS",
        rate: 1050.25,
      };
      const fetchMock = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await getExchangeRateQuoteApi("USD", "ARS");

      expect(result).toEqual(mockData);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/rates/quote?from=USD&to=ARS")
      );
    });

    it("lanza un error si el backend responde con código de error", async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "No se pudo obtener la cotización" }), {
          status: 502,
        })
      );
      vi.stubGlobal("fetch", fetchMock);

      await expect(getExchangeRateQuoteApi("USD", "EUR")).rejects.toThrow(
        "No se pudo obtener la cotización"
      );
    });
  });

  describe("getRateHistoryApi", () => {
    it("consulta /rates/history y filtra puntos válidos", async () => {
      const mockHistory = {
        base: "USD",
        quote: "EUR",
        source: "frankfurter",
        points: [
          { date: "2026-09-01", rate: 0.92 },
          { date: "2026-09-02", rate: 0.93 },
          { date: "2026-09-03", rate: "invalido" },
        ],
      };
      const fetchMock = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(mockHistory), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await getRateHistoryApi("USD", "EUR", "30d");

      expect(result.base).toBe("USD");
      expect(result.quote).toBe("EUR");
      expect(result.range).toBe("30d");
      expect(result.points).toEqual([
        { date: "2026-09-01", rate: 0.92 },
        { date: "2026-09-02", rate: 0.93 },
      ]);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/rates/history?base=USD&quote=EUR&range=30d")
      );
    });

    it("lanza un error si la respuesta no tiene formato válido", async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ base: 123 }), { status: 200 })
      );
      vi.stubGlobal("fetch", fetchMock);

      await expect(getRateHistoryApi("USD", "EUR", "7d")).rejects.toThrow(
        "La respuesta del histórico de divisas no tiene un formato válido."
      );
    });
  });
});
