import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { transferApi } from "../../api/wallet.api.ts";
import { formatAmount } from "../../utils/formatters.ts";
import { CURRENCY_NAMES, CURRENCY_TO_COUNTRY } from "../../utils/currency.ts";
import { OperationLayout } from "../../components/common/OperationLayout.tsx";
import { CurrencySelect } from "../../components/common/CurrencySelect.tsx";
import { AmountInput } from "../../components/common/AmountInput.tsx";
import { OperationConfirmModal } from "../../components/common/OperationConfirmModal.tsx";
import { OperationReceipt } from "../../components/common/OperationReceipt.tsx";
import { notifyWalletUpdate } from "../../utils/syncEvents.ts";
import { useWalletBalances } from "../../hooks/useWalletBalances.ts";
import "./TransferPage.css";

interface TransferReceiptData {
  transactionId?: string;
  recipient: string;
  currency: string;
  amount: number;
  memo?: string;
}

export default function TransferPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [recipientUsername, setRecipientUsername] = useState("");
  const [currency, setCurrency] = useState(() => {
    const paramCurrency = searchParams.get("currency")?.trim().toUpperCase();
    if (paramCurrency && paramCurrency in CURRENCY_TO_COUNTRY) {
      return paramCurrency;
    }
    return "USD";
  });

  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [receipt, setReceipt] = useState<TransferReceiptData | null>(null);

  const { wallet, walletLoading } = useWalletBalances();
  const currentBalance = wallet?.balances.find((b) => b.currency === currency);
  const availableAmount = Number(currentBalance?.amount || 0);

  const numericAmount = Number(amount);
  const normalizedRecipient = recipientUsername.trim().replace(/^@/, "");
  const normalizedMemo = memo.trim();

  const amountTooHigh = Boolean(wallet && numericAmount > availableAmount);
  const amountInvalid = Boolean(amount && (numericAmount <= 0 || isNaN(numericAmount)));
  const inlineAmountError = amountTooHigh
    ? `Saldo insuficiente. Tu saldo disponible es de ${formatAmount(availableAmount)} ${currency}.`
    : amountInvalid
    ? "Ingresa un monto válido, mayor a 0."
    : "";

  const handleOpenConfirm = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!normalizedRecipient) {
      setError("Ingresa el nombre de usuario del destinatario.");
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setError("Ingresa un monto válido, mayor a 0.");
      return;
    }

    if (wallet && numericAmount > availableAmount) {
      setError(`Saldo insuficiente. Tu saldo disponible es de ${formatAmount(availableAmount)} ${currency}.`);
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmTransfer = async () => {
    setLoading(true);
    setError("");
    try {
      const transaction = await transferApi(
        normalizedRecipient,
        currency,
        numericAmount,
        normalizedMemo || undefined,
      );
      notifyWalletUpdate();
      setIsConfirmOpen(false);
      setReceipt({
        transactionId: transaction?.id,
        recipient: normalizedRecipient,
        currency,
        amount: numericAmount,
        memo: normalizedMemo,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo procesar la transferencia.";
      setError(msg);
      setIsConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OperationLayout
      title="Enviar dinero"
      subtitle="Transfiere saldo a otro usuario de Axora de forma instantánea."
      className="transfer-page"
      cardClassName="transfer-card"
    >
      {receipt ? (
        <OperationReceipt
          title="¡Transferencia exitosa!"
          subtitle={`Has enviado ${formatAmount(receipt.amount)} ${receipt.currency} a @${receipt.recipient}.`}
          referenceId={receipt.transactionId}
          items={[
            {
              label: "Destinatario",
              value: `@${receipt.recipient}`,
            },
            {
              label: "Monto transferido",
              value: `${formatAmount(receipt.amount)} ${receipt.currency}`,
            },
            {
              label: "Costo de transferencia",
              value: "Gratuito ($0,00)",
            },
            ...(receipt.memo
              ? [
                  {
                    label: "Nota",
                    value: receipt.memo,
                  },
                ]
              : []),
            {
              label: "Total debitado",
              value: `${formatAmount(receipt.amount)} ${receipt.currency}`,
              isHighlight: true,
            },
          ]}
          primaryActionText="Ir al panel principal"
          onPrimaryAction={() => navigate("/dashboard")}
          secondaryActionText="Enviar otra transferencia"
          onSecondaryAction={() => {
            setReceipt(null);
            setAmount("");
            setMemo("");
            setRecipientUsername("");
          }}
        />
      ) : (
        <form onSubmit={handleOpenConfirm} className="transfer-form" noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="recipient_username">
              Nombre de usuario del destinatario
            </label>
            <input
              id="recipient_username"
              className={`form-input${error && !normalizedRecipient ? " has-error" : ""}`}
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="usuario123"
              value={recipientUsername}
              onChange={(e) => setRecipientUsername(e.target.value)}
              disabled={loading}
            />
          </div>

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

          <div className="form-field">
            <label className="form-label" htmlFor="amount">
              Monto
            </label>
            <AmountInput
              id="amount"
              value={amount}
              onChange={setAmount}
              disabled={loading}
              hasError={Boolean((error && (!numericAmount || numericAmount <= 0)) || inlineAmountError)}
              ariaLabel="Monto"
            />
            <span className="exchange-balance-hint">
              Saldo disponible:{" "}
              <strong>
                {walletLoading ? "cargando…" : `${formatAmount(availableAmount)} ${currency}`}
              </strong>
            </span>
            {inlineAmountError && (
              <span className="form-field-error" style={{ color: "#ef4444", fontSize: "0.82rem", fontWeight: 600, marginTop: "4px", display: "block" }}>
                {inlineAmountError}
              </span>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="memo">
              Nota o motivo (opcional)
            </label>
            <input
              id="memo"
              className="form-input"
              type="text"
              placeholder="Para las cervezas en Bangkok 🍻"
              maxLength={255}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="transfer-summary-box">
            <div className="summary-line">
              <span>Costo de transferencia:</span>
              <span className="summary-free">Gratuito ($0,00)</span>
            </div>
            <div className="summary-line">
              <span>Monto a transferir:</span>
              <span className="summary-highlight">
                {numericAmount > 0
                  ? `${formatAmount(numericAmount)} ${currency}`
                  : `0,00 ${currency}`}
              </span>
            </div>
          </div>

          {error && (
            <div className="transfer-error" role="alert">
              <em className="transfer-error-icon" aria-hidden="true">
                ✕
              </em>
              {error}
            </div>
          )}

          <button type="submit" className="transfer-submit" disabled={loading}>
            {loading ? "Procesando…" : "Enviar dinero"}
          </button>
          <button
            type="button"
            className="transfer-cancel"
            onClick={() => navigate("/dashboard")}
            disabled={loading}
          >
            Cancelar
          </button>
        </form>
      )}

      <OperationConfirmModal
        isOpen={isConfirmOpen}
        title="Confirmar transferencia"
        subtitle="Verifica los datos del envío antes de procesar."
        confirmText="Confirmar envío"
        cancelText="Volver"
        loading={loading}
        onConfirm={handleConfirmTransfer}
        onClose={() => setIsConfirmOpen(false)}
        items={[
          {
            label: "Destinatario",
            value: `@${normalizedRecipient}`,
          },
          {
            label: "Moneda",
            value: `${currency} — ${CURRENCY_NAMES[currency] ?? currency}`,
          },
          {
            label: "Monto",
            value: `${formatAmount(numericAmount)} ${currency}`,
          },
          ...(normalizedMemo
            ? [
                {
                  label: "Nota",
                  value: normalizedMemo,
                },
              ]
            : []),
          {
            label: "Costo de transferencia",
            value: "Gratuito ($0,00)",
          },
          {
            label: "Total a debitar",
            value: `${formatAmount(numericAmount)} ${currency}`,
            isHighlight: true,
          },
        ]}
      />
    </OperationLayout>
  );
}
