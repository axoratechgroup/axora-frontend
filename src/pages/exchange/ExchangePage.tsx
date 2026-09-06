import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import { ArrowLeftRight } from "lucide-react";
import { useWallet } from "../../hooks/useWallet.ts";
import { exchangeApi } from "../../api/wallet.api.ts";
import { formatAmount, formatAmountInputDisplay, parseAmountInputDisplay } from "../../utils/formatters.ts";
import { CURRENCY_TO_COUNTRY, getCountryCode } from "../../utils/currency.ts";
import "./ExchangePage.css";

const CURRENCY_NAMES: Record<string, string> = {
  USD: "Dólar estadounidense",
  ARS: "Peso argentino",
  MXN: "Peso mexicano",
  COP: "Peso colombiano",
  BRL: "Real brasileño",
  EUR: "Euro",
};

function CurrencySelect({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const countryCode = getCountryCode(value);

  return (
    <div className="exchange-currency-row">
      {countryCode && (
        <ReactCountryFlag
          countryCode={countryCode}
          svg
          style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0 }}
          aria-label={CURRENCY_NAMES[value] ?? value}
        />
      )}
      <select
        id={id}
        className="form-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {Object.keys(CURRENCY_TO_COUNTRY).map((code) => (
          <option key={code} value={code}>
            {code} — {CURRENCY_NAMES[code] ?? code}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ExchangePage() {
  const navigate = useNavigate();
  const { wallet } = useWallet();

  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("ARS");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ toAmount: string; toCurrency: string } | null>(null);

  const currentBalance = wallet?.balances.find((b) => b.currency === fromCurrency);
  const availableAmount = Number(currentBalance?.amount || 0);

  const numericAmount = Number(amount) || 0;
  const fee = Math.round(numericAmount * 0.003 * 100) / 100;
  const netAmount = Math.max(0, numericAmount - fee);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (fromCurrency === toCurrency) {
      setError("Elige dos monedas distintas.");
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setError("Ingresa un monto válido, mayor a 0.");
      return;
    }

    if (!window.confirm(`¿Confirmas el cambio de ${numericAmount} ${fromCurrency} a ${toCurrency}?`)) {
      return;
    }

    setLoading(true);
    try {
      const transaction = await exchangeApi(fromCurrency, toCurrency, numericAmount);
      setResult({ toAmount: transaction.to_amount, toCurrency: transaction.to_currency });
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "No se pudo procesar el cambio de moneda.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="exchange-page">
      <div className="exchange-card">
        <h1 className="exchange-title">Comprar / vender</h1>
        <p className="exchange-subtitle">Cambia saldo entre monedas dentro de tu cuenta Axora.</p>

        {result ? (
          <p className="exchange-success">
            Cambio exitoso: recibiste {result.toAmount} {result.toCurrency}. Volviendo a tu
            cuenta…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="exchange-form" noValidate>
            <div className="form-field">
              <label className="form-label" htmlFor="from_currency">
                De
              </label>
              <CurrencySelect
                id="from_currency"
                value={fromCurrency}
                onChange={setFromCurrency}
                disabled={loading}
              />
              <span className="exchange-balance-hint">
                Saldo disponible: <strong>{formatAmount(availableAmount)} {fromCurrency}</strong>
              </span>
            </div>

            <button
              type="button"
              className="exchange-swap-btn"
              onClick={handleSwap}
              disabled={loading}
              aria-label="Invertir monedas"
            >
              <ArrowLeftRight size={18} aria-hidden="true" />
            </button>

            <div className="form-field">
              <label className="form-label" htmlFor="to_currency">
                A
              </label>
              <CurrencySelect
                id="to_currency"
                value={toCurrency}
                onChange={setToCurrency}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="amount">
                Monto a cambiar (en {fromCurrency})
              </label>
              <input
                id="amount"
                className={`form-input${error ? " has-error" : ""}`}
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={formatAmountInputDisplay(amount)}
                onChange={(e) => setAmount(parseAmountInputDisplay(e.target.value))}
                disabled={loading}
              />
            </div>

            {numericAmount > 0 && (
              <div className="exchange-summary-box">
                <div className="summary-line">
                  <span>Comisión de cambio (0.3%):</span>
                  <span>{formatAmount(fee)} {fromCurrency}</span>
                </div>
                <div className="summary-line">
                  <span>Monto neto a convertir:</span>
                  <span className="summary-highlight">{formatAmount(netAmount)} {fromCurrency}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="exchange-error" role="alert">
                <em className="exchange-error-icon" aria-hidden="true">
                  ✕
                </em>
                {error}
              </div>
            )}

            <button type="submit" className="exchange-submit" disabled={loading}>
              {loading ? "Procesando…" : "Cambiar"}
            </button>
            <button
              type="button"
              className="exchange-cancel"
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