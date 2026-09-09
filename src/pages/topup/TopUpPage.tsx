import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { topupApi } from "../../api/wallet.api.ts";
import { getExchangeRateQuoteApi } from "../../api/rates.api.ts";
import {
  formatAmount,
  formatExchangeRate,
} from "../../utils/formatters.ts";
import {
  CURRENCY_NAMES,
  CURRENCY_TO_COUNTRY,
  getFallbackExchangeRate,
} from "../../utils/currency.ts";
import { OperationLayout } from "../../components/common/OperationLayout.tsx";
import { CurrencySelect } from "../../components/common/CurrencySelect.tsx";
import { AmountInput } from "../../components/common/AmountInput.tsx";
import { OperationConfirmModal } from "../../components/common/OperationConfirmModal.tsx";
import { OperationReceipt } from "../../components/common/OperationReceipt.tsx";
import { notifyWalletUpdate } from "../../utils/syncEvents.ts";
import "./TopUpPage.css";

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

interface TopUpReceiptData {
  transactionId?: string;
  currency: string;
  amount: number;
  referenceRate?: number | null;
  usdEquivalent?: number | null;
}

export default function TopUpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currency, setCurrency] = useState(() => {
    const paramCurrency = searchParams.get("currency")?.trim().toUpperCase();
    if (paramCurrency && paramCurrency in CURRENCY_TO_COUNTRY) {
      return paramCurrency;
    }
    return detectCurrencyFromBrowser();
  });

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [receipt, setReceipt] = useState<TopUpReceiptData | null>(null);
  const [quoteRate, setQuoteRate] = useState<number | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    if (currency === "USD") {
      setQuoteRate(1);
      setQuoteLoading(false);
      return;
    }

    let isCurrent = true;

    async function loadQuote() {
      setQuoteLoading(true);
      try {
        const data = await getExchangeRateQuoteApi("USD", currency);
        if (isCurrent) {
          setQuoteRate(data.rate);
        }
      } catch {
        if (isCurrent) {
          const fallback = getFallbackExchangeRate("USD", currency);
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
  }, [currency]);

  const numericAmount = Number(amount) || 0;
  const effectiveQuoteRate = currency === "USD" ? 1 : quoteRate;
  const usdEquivalent =
    currency === "USD"
      ? numericAmount
      : effectiveQuoteRate && effectiveQuoteRate > 0
        ? Math.round((numericAmount / effectiveQuoteRate) * 100) / 100
        : null;

  const handleOpenConfirm = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!numericAmount || numericAmount <= 0) {
      setError("Ingresa un monto válido, mayor a 0.");
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmTopUp = async () => {
    setLoading(true);
    setError("");
    try {
      const transaction = await topupApi(currency, numericAmount);
      notifyWalletUpdate();
      setIsConfirmOpen(false);
      setReceipt({
        transactionId: transaction?.id,
        currency,
        amount: numericAmount,
        referenceRate: currency !== "USD" ? effectiveQuoteRate : null,
        usdEquivalent: currency !== "USD" ? usdEquivalent : null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo procesar la carga.";
      setError(msg);
      setIsConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OperationLayout
      title="Cargar dinero"
      subtitle="Agrega saldo a tu cuenta Axora de forma inmediata."
      className="topup-page"
      cardClassName="topup-card"
    >
      {receipt ? (
        <OperationReceipt
          title="¡Carga completada!"
          subtitle={`Se han acreditado ${formatAmount(receipt.amount)} ${receipt.currency} en tu cuenta.`}
          referenceId={receipt.transactionId}
          items={[
            {
              label: "Monto cargado",
              value: `${formatAmount(receipt.amount)} ${receipt.currency}`,
            },
            ...(receipt.currency !== "USD" && receipt.referenceRate
              ? [
                  {
                    label: "Tasa de referencia (USD)",
                    value: `1 USD ≈ ${formatExchangeRate(receipt.referenceRate)} ${receipt.currency}`,
                  },
                  ...(receipt.usdEquivalent !== null && receipt.usdEquivalent !== undefined
                    ? [
                        {
                          label: "Equivalente aprox. en USD",
                          value: `≈ $${formatAmount(receipt.usdEquivalent)} USD`,
                        },
                      ]
                    : []),
                ]
              : []),
            {
              label: "Costo de operación",
              value: "Gratuito ($0,00)",
            },
            {
              label: "Total acreditado",
              value: `${formatAmount(receipt.amount)} ${receipt.currency}`,
              isHighlight: true,
            },
          ]}
          primaryActionText="Ir al panel principal"
          onPrimaryAction={() => navigate("/dashboard")}
          secondaryActionText="Cargar más saldo"
          onSecondaryAction={() => {
            setReceipt(null);
            setAmount("");
          }}
        />
      ) : (
        <form onSubmit={handleOpenConfirm} className="topup-form" noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="currency">
              Moneda
            </label>
            <CurrencySelect
              id="currency"
              value={currency}
              onChange={setCurrency}
              disabled={loading}
              ariaLabel="Moneda"
            />
          </div>

          {currency !== "USD" && (
            <div className="topup-rate-banner" aria-live="polite">
              <span className="topup-rate-label">Tasa de referencia (USD):</span>
              <span className="topup-rate-value">
                {quoteLoading ? (
                  "Consultando cotización en vivo…"
                ) : effectiveQuoteRate !== null ? (
                  `1 USD ≈ ${formatExchangeRate(effectiveQuoteRate)} ${currency}`
                ) : (
                  "Cotización no disponible"
                )}
              </span>
            </div>
          )}

          <div className="form-field">
            <label className="form-label" htmlFor="amount">
              Monto
            </label>
            <AmountInput
              id="amount"
              value={amount}
              onChange={setAmount}
              disabled={loading}
              hasError={Boolean(error)}
              ariaLabel="Monto"
            />
          </div>

          <div className="topup-summary-box">
            <div className="summary-line">
              <span>Costo de transacción:</span>
              <span className="summary-free">Gratuito ($0,00)</span>
            </div>
            {currency !== "USD" && effectiveQuoteRate !== null && (
              <div className="summary-line">
                <span>Tasa de referencia (USD):</span>
                <span>1 USD ≈ {formatExchangeRate(effectiveQuoteRate)} {currency}</span>
              </div>
            )}
            {currency !== "USD" && numericAmount > 0 && usdEquivalent !== null && (
              <div className="summary-line">
                <span>Equivalente aprox. en USD:</span>
                <span className="summary-usd-approx">≈ ${formatAmount(usdEquivalent)} USD</span>
              </div>
            )}
            <div className="summary-line">
              <span>Total a acreditar:</span>
              <span className="summary-highlight">
                {numericAmount > 0
                  ? `${formatAmount(numericAmount)} ${currency}`
                  : `0,00 ${currency}`}
              </span>
            </div>
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

      <OperationConfirmModal
        isOpen={isConfirmOpen}
        title="Confirmar carga de saldo"
        subtitle="Verifica los detalles antes de acreditar fondos."
        confirmText="Confirmar carga"
        cancelText="Volver"
        loading={loading}
        onConfirm={handleConfirmTopUp}
        onClose={() => setIsConfirmOpen(false)}
        items={[
          {
            label: "Moneda",
            value: `${currency} — ${CURRENCY_NAMES[currency] ?? currency}`,
          },
          ...(currency !== "USD" && effectiveQuoteRate !== null
            ? [
                {
                  label: "Tasa de referencia (USD)",
                  value: `1 USD ≈ ${formatExchangeRate(effectiveQuoteRate)} ${currency}`,
                },
                ...(numericAmount > 0 && usdEquivalent !== null
                  ? [
                      {
                        label: "Equivalente aprox. en USD",
                        value: `≈ $${formatAmount(usdEquivalent)} USD`,
                      },
                    ]
                  : []),
              ]
            : []),
          {
            label: "Costo de transacción",
            value: "Gratuito ($0,00)",
          },
          {
            label: "Total a acreditar",
            value: `${formatAmount(numericAmount)} ${currency}`,
            isHighlight: true,
          },
        ]}
      />
    </OperationLayout>
  );
}
