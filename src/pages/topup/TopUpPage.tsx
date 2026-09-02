import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import { topupApi } from "../../api/wallet.api.ts";
import { CURRENCY_TO_COUNTRY, getCountryCode } from "../../utils/currency.ts";
import "./TopUpPage.css";

const CURRENCY_NAMES: Record<string, string> = {
  USD: "Dólar estadounidense",
  ARS: "Peso argentino",
  MXN: "Peso mexicano",
  COP: "Peso colombiano",
  BRL: "Real brasileño",
  EUR: "Euro",
};

const COUNTRY_TO_CURRENCY = Object.fromEntries(
  Object.entries(CURRENCY_TO_COUNTRY).map(([currency, country]) => [
    country,
    currency,
  ]),
);

function detectCurrencyFromBrowser(): string {
  try {
    const locale = navigator.language || navigator.languages?.[0] || "";
    const country = locale.split("-")[1]?.toUpperCase();
    return (country && COUNTRY_TO_CURRENCY[country]) || "USD";
  } catch {
    return "USD";
  }
}

export default function TopUpPage() {
  const navigate = useNavigate();

  const [currency, setCurrency] = useState(detectCurrencyFromBrowser);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const countryCode = getCountryCode(currency);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Ingresa un monto válido, mayor a 0.");
      return;
    }

    setLoading(true);
    try {
      await topupApi(currency, numericAmount);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "No se pudo procesar la carga.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="topup-page">
      <div className="topup-card">
        <h1 className="topup-title">Cargar dinero</h1>
        <p className="topup-subtitle">Agrega saldo a tu cuenta Axora.</p>

        {success ? (
          <p className="topup-success">Carga exitosa. Volviendo a tu cuenta…</p>
        ) : (
          <form onSubmit={handleSubmit} className="topup-form" noValidate>
            <div className="form-field">
              <label className="form-label" htmlFor="currency">
                Moneda
              </label>
              <div className="topup-currency-row">
                {countryCode && (
                  <ReactCountryFlag
                    countryCode={countryCode}
                    svg
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      flexShrink: 0,
                    }}
                    aria-label={CURRENCY_NAMES[currency] ?? currency}
                  />
                )}
                <select
                  id="currency"
                  className="form-input"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={loading}
                >
                  {Object.keys(CURRENCY_TO_COUNTRY).map((code) => (
                    <option key={code} value={code}>
                      {code} — {CURRENCY_NAMES[code] ?? code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="amount">
                Monto
              </label>
              <input
                id="amount"
                className={`form-input${error ? " has-error" : ""}`}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="topup-error" role="alert">
                <em className="topup-error-icon" aria-hidden="true">
                  ✕
                </em>
                {error}
              </div>
            )}

            <button type="submit" className="topup-submit" disabled={loading}>
              {loading ? "Procesando…" : "Cargar saldo"}
            </button>
            <button
              type="button"
              className="topup-cancel"
              onClick={() => navigate("/dashboard")}
              disabled={loading}
            >
              Cancelar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
