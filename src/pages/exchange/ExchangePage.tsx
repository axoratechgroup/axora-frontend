import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftRight } from "lucide-react";
import { useWalletBalances } from "../../hooks/useWalletBalances.ts";
import { exchangeApi } from "../../api/wallet.api.ts";
import { getExchangeRateQuoteApi } from "../../api/rates.api.ts";
import {
  formatAmount,
  formatExchangeRate,
} from "../../utils/formatters.ts";
import {
  CURRENCY_TO_COUNTRY,
  getFallbackExchangeRate,
} from "../../utils/currency.ts";
import { OperationLayout } from "../../components/common/OperationLayout.tsx";
import { CurrencySelect } from "../../components/common/CurrencySelect.tsx";
import { AmountInput } from "../../components/common/AmountInput.tsx";
import { OperationConfirmModal } from "../../components/common/OperationConfirmModal.tsx";
import { OperationReceipt } from "../../components/common/OperationReceipt.tsx";
import "./ExchangePage.css";

interface ExchangeReceiptData {
  transactionId: string;
  fromAmount: number;
  fromCurrency: string;
  toAmount: string;
  toCurrency: string;
  appliedRate?: string | null;
  fee: number;
}

export default function ExchangePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { wallet, walletLoading, reloadWallet } = useWalletBalances();

  const [fromCurrency, setFromCurrency] = useState(() => {
    const paramFrom = searchParams.get("from")?.trim().toUpperCase();
    if (paramFrom && paramFrom in CURRENCY_TO_COUNTRY) {
      return paramFrom;
    }
    return "USD";
  });

  const [toCurrency, setToCurrency] = useState(() => {
    const paramFrom = searchParams.get("from")?.trim().toUpperCase();
    const paramTo = searchParams.get("to")?.trim().toUpperCase();
    const effectiveFrom = paramFrom && paramFrom in CURRENCY_TO_COUNTRY ? paramFrom : "USD";
    if (paramTo && paramTo in CURRENCY_TO_COUNTRY && paramTo !== effectiveFrom) {
      return paramTo;
    }
    return effectiveFrom === "ARS" ? "USD" : "ARS";
  });

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [receipt, setReceipt] = useState<ExchangeReceiptData | null>(null);
  const [quoteRate, setQuoteRate] = useState<number | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    if (fromCurrency === toCurrency) {
      return;
    }

    let isCurrent = true;

    async function loadQuote() {
      setQuoteLoading(true);
      try {
        const data = await getExchangeRateQuoteApi(fromCurrency, toCurrency);
        if (isCurrent) {
          setQuoteRate(data.rate);
        }
      } catch {
        if (isCurrent) {
          const fallback = getFallbackExchangeRate(fromCurrency, toCurrency);
          setQuoteRate(fallback || null);
        }
      } finally {
        if (isCurrent) {
          setQuoteLoading(false);
        }
      }
    }

    void loadQuote();

    return () => {
      isCurrent = false;
    };
  }, [fromCurrency, toCurrency]);

  const effectiveQuoteRate = fromCurrency === toCurrency ? 1 : quoteRate;
  const effectiveQuoteLoading = fromCurrency === toCurrency ? false : quoteLoading;

  const currentBalance = wallet?.balances.find((b) => b.currency === fromCurrency);
  const availableAmount = Number(currentBalance?.amount || 0);

  const numericAmount = Number(amount) || 0;
  const fee = Math.round(numericAmount * 0.003 * 100) / 100;
  const netAmount = Math.max(0, numericAmount - fee);
  const grossToAmount = effectiveQuoteRate ? numericAmount * effectiveQuoteRate : 0;
  const estimatedToAmount = effectiveQuoteRate ? Math.max(0, grossToAmount * (1 - 0.003)) : 0;

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const amountTooHigh = Boolean(wallet && numericAmount > availableAmount);
  const amountInvalid = Boolean(amount && (numericAmount <= 0 || isNaN(numericAmount)));
  const sameCurrency = fromCurrency === toCurrency;

  const inlineAmountError = sameCurrency
    ? "Elige dos monedas distintas."
    : amountTooHigh
    ? `Saldo insuficiente. Tu saldo disponible es de ${formatAmount(availableAmount)} ${fromCurrency}.`
    : amountInvalid
    ? "Ingresa un monto válido, mayor a 0."
    : "";

  const handleOpenConfirm = (e: FormEvent) => {
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

    if (wallet && numericAmount > availableAmount) {
      setError(`Saldo insuficiente. Tu saldo disponible es de ${formatAmount(availableAmount)} ${fromCurrency}.`);
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmExchange = async () => {
    setLoading(true);
    setError("");
    try {
      const transaction = await exchangeApi(fromCurrency, toCurrency, numericAmount);
      await reloadWallet();
      setIsConfirmOpen(false);
      setReceipt({
        transactionId: transaction.id,
        fromAmount: numericAmount,
        fromCurrency,
        toAmount: transaction.to_amount,
        toCurrency: transaction.to_currency,
        appliedRate: transaction.applied_exchange_rate,
        fee,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo procesar el cambio de moneda.";
      setError(msg);
      setIsConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OperationLayout
      title="Comprar / vender"
      subtitle="Cambia saldo entre monedas dentro de tu cuenta Axora."
      className="exchange-page"
      cardClassName="exchange-card"
    >
      {receipt ? (
        <OperationReceipt
          title="¡Cambio realizado con éxito!"
          subtitle={`Has convertido ${formatAmount(receipt.fromAmount)} ${receipt.fromCurrency} a ${receipt.toCurrency}.`}
          referenceId={receipt.transactionId}
          items={[
            {
              label: "Monto entregado",
              value: `${formatAmount(receipt.fromAmount)} ${receipt.fromCurrency}`,
            },
            {
              label: "Comisión Axora (0.3%)",
              value: `${formatAmount(receipt.fee)} ${receipt.fromCurrency}`,
            },
            {
              label: "Tasa aplicada",
              value: receipt.appliedRate
                ? `1 ${receipt.fromCurrency} = ${formatExchangeRate(receipt.appliedRate)} ${receipt.toCurrency}`
                : "N/A",
            },
            {
              label: "Total acreditado",
              value: `${formatAmount(receipt.toAmount)} ${receipt.toCurrency}`,
              isHighlight: true,
            },
          ]}
          primaryActionText="Ir al panel principal"
          onPrimaryAction={() => navigate("/dashboard")}
          secondaryActionText="Hacer otro cambio"
          onSecondaryAction={() => {
            setReceipt(null);
            setAmount("");
          }}
        />
      ) : (
        <form onSubmit={handleOpenConfirm} className="exchange-form" noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="from_currency">
              De
            </label>
            <CurrencySelect
              id="from_currency"
              value={fromCurrency}
              onChange={setFromCurrency}
              disabled={loading}
              ariaLabel="Moneda de origen"
            />
            <span className="exchange-balance-hint">
              Saldo disponible:{" "}
              <strong>
                {walletLoading ? "cargando…" : `${formatAmount(availableAmount)} ${fromCurrency}`}
              </strong>
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
              ariaLabel="Moneda de destino"
            />
          </div>

          {fromCurrency !== toCurrency && (
            <div className="exchange-rate-banner" aria-live="polite">
              <span className="exchange-rate-label">Tasa de cambio:</span>
              <span className="exchange-rate-value">
                {effectiveQuoteLoading ? (
                  "Consultando cotización en vivo…"
                ) : effectiveQuoteRate !== null ? (
                  `1 ${fromCurrency} = ${formatExchangeRate(effectiveQuoteRate)} ${toCurrency}`
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
            <AmountInput
              id="amount"
              value={amount}
              onChange={setAmount}
              disabled={loading}
              hasError={Boolean(error || inlineAmountError)}
              ariaLabel={`Monto a cambiar en ${fromCurrency}`}
            />
            {inlineAmountError && (
              <span className="form-field-error" style={{ color: "#ef4444", fontSize: "0.82rem", fontWeight: 600, marginTop: "4px", display: "block" }}>
                {inlineAmountError}
              </span>
            )}
          </div>

          {numericAmount > 0 && (
            <div className="exchange-summary-box">
              {effectiveQuoteRate !== null && fromCurrency !== toCurrency && (
                <div className="summary-line">
                  <span>Tasa de conversión:</span>
                  <span>1 {fromCurrency} = {formatExchangeRate(effectiveQuoteRate)} {toCurrency}</span>
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
              {effectiveQuoteRate !== null && estimatedToAmount > 0 && fromCurrency !== toCurrency && (
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

      <OperationConfirmModal
        isOpen={isConfirmOpen}
        title="Confirmar cambio de moneda"
        subtitle="Verifica las condiciones antes de completar la conversión."
        confirmText="Confirmar cambio"
        cancelText="Volver"
        loading={loading}
        onConfirm={handleConfirmExchange}
        onClose={() => setIsConfirmOpen(false)}
        items={[
          {
            label: "De",
            value: `${formatAmount(numericAmount)} ${fromCurrency}`,
          },
          {
            label: "Tasa aplicada / estimada",
            value:
              effectiveQuoteRate !== null
                ? `1 ${fromCurrency} = ${formatExchangeRate(effectiveQuoteRate)} ${toCurrency}`
                : "No disponible",
          },
          {
            label: "Comisión Axora (0.3%)",
            value: `${formatAmount(fee)} ${fromCurrency}`,
          },
          {
            label: "Monto neto a convertir",
            value: `${formatAmount(netAmount)} ${fromCurrency}`,
          },
          {
            label: "Recibirás aprox.",
            value: `≈ ${formatAmount(estimatedToAmount)} ${toCurrency}`,
            isHighlight: true,
          },
        ]}
      />
    </OperationLayout>
  );
}
