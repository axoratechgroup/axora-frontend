import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import { useWallet } from "../../hooks/useWallet.ts";
import { exchangeApi } from "../../api/wallet.api.ts";
import { getExchangeRateQuoteApi } from "../../api/rates.api.ts";
import {
  formatAmount,
  formatAmountInputDisplay,
  parseAmountInputDisplay,
  formatExchangeRate,
} from "../../utils/formatters.ts";
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

const FALLBACK_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  ARS: 0.00075,
  COP: 0.00025,
  MXN: 0.051,
  BRL: 0.17,
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
  const [result, setResult] = useState<{
    toAmount: string;
    toCurrency: string;
    appliedRate?: string | null;
  } | null>(null);
  const [quoteRate, setQuoteRate] = useState<number | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    if (fromCurrency === toCurrency) {
      setQuoteRate(1);
      return;
    }

    setQuoteLoading(true);
    getExchangeRateQuoteApi(fromCurrency, toCurrency)
      .then((data) => {
        if (isCurrent) {
          setQuoteRate(data.rate);
        }
      })
      .catch(() => {
        if (isCurrent) {
          const fromRate = FALLBACK_RATES_TO_USD[fromCurrency] ?? 1;
          const toRate = FALLBACK_RATES_TO_USD[toCurrency] ?? 1;
          setQuoteRate(fromRate / toRate);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setQuoteLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [fromCurrency, toCurrency]);

  const currentBalance = wallet?.balances.find((b) => b.currency === fromCurrency);
  const availableAmount = Number(currentBalance?.amount || 0);

  const numericAmount = Number(amount) || 0;
  const fee = Math.round(numericAmount * 0.003 * 100) / 100;
  const netAmount = Math.max(0, numericAmount - fee);
  const grossToAmount = quoteRate ? numericAmount * quoteRate : 0;
  const estimatedToAmount = quoteRate ? Math.max(0, grossToAmount * (1 - 0.003)) : 0;

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

    const confirmMessage =
      quoteRate && estimatedToAmount > 0
        ? `¿Confirmas el cambio de ${formatAmount(numericAmount)} ${fromCurrency} a aproximadamente ${formatAmount(
            estimatedToAmount,
          )} ${toCurrency}?\nTasa: 1 ${fromCurrency} = ${formatExchangeRate(quoteRate)} ${toCurrency}`
        : `¿Confirmas el cambio de ${numericAmount} ${fromCurrency} a ${toCurrency}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const transaction = await exchangeApi(fromCurrency, toCurrency, numericAmount);
      setResult({
        toAmount: transaction.to_amount,
        toCurrency: transaction.to_currency,
        appliedRate: transaction.applied_exchange_rate,
      });
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
        <div className="op-card-header">
          <button
            type="button"
            className="op-back-btn"
            onClick={() => navigate("/dashboard")}
            aria-label="Volver al panel"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Volver al panel</span>
          </button>
        </div>

        <h1 className="exchange-title">Comprar / vender</h1>
        <p className="exchange-subtitle">Cambia saldo entre monedas dentro de tu cuenta Axora.</p>

        {result ? (
          <div className="exchange-success">
            <p style={{ margin: 0 }}>
              Cambio exitoso: recibiste {formatAmount(result.toAmount)} {result.toCurrency}. Volviendo a tu
              cuenta…
            </p>
            {result.appliedRate ? (
              <p className="exchange-success-rate">
                Tasa aplicada: 1 {fromCurrency} = {formatExchangeRate(result.appliedRate)} {result.toCurrency}
              </p>
            ) : null}
          </div>
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

            {fromCurrency !== toCurrency && (
              <div className="exchange-rate-banner" aria-live="polite">
                <span className="exchange-rate-label">Tasa de cambio:</span>
                <span className="exchange-rate-value">
                  {quoteLoading ? (
                    "Consultando cotización en vivo…"
                  ) : quoteRate !== null ? (
                    `1 ${fromCurrency} = ${formatExchangeRate(quoteRate)} ${toCurrency}`
                  ) : (
                    "Cotización no disponible"
                  )}
                </span>
              </div>
            )}

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
                {quoteRate !== null && fromCurrency !== toCurrency && (
                  <div className="summary-line">
                    <span>Tasa de conversión:</span>
                    <span>1 {fromCurrency} = {formatExchangeRate(quoteRate)} {toCurrency}</span>
                  </div>
                )}
                <div className="summary-line">
                  <span>Comisión de cambio (0.3%):</span>
                  <span>{formatAmount(fee)} {fromCurrency}</span>
                </div>
                <div className="summary-line">
                  <span>Monto neto a convertir:</span>
                  <span className="summary-highlight">{formatAmount(netAmount)} {fromCurrency}</span>
                </div>
                {quoteRate !== null && estimatedToAmount > 0 && fromCurrency !== toCurrency && (
                  <div className="summary-line summary-receive-row">
                    <span>Recibirás aproximadamente:</span>
                    <span className="summary-receive-amount">≈ {formatAmount(estimatedToAmount)} {toCurrency}</span>
                  </div>
                )}
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