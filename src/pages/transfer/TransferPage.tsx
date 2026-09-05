import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import { transferApi } from "../../api/wallet.api.ts";
import { formatAmountInputDisplay, parseAmountInputDisplay } from "../../utils/formatters.ts";
import { CURRENCY_TO_COUNTRY, getCountryCode } from "../../utils/currency.ts";
import "./TransferPage.css";

const CURRENCY_NAMES: Record<string, string> = {
  USD: "Dólar estadounidense",
  ARS: "Peso argentino",
  MXN: "Peso mexicano",
  COP: "Peso colombiano",
  BRL: "Real brasileño",
  EUR: "Euro",
};

export default function TransferPage() {
  const navigate = useNavigate();
  const [recipientUsername, setRecipientUsername] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const countryCode = getCountryCode(currency);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!recipientUsername.trim()) {
      setError("Ingresa el nombre de usuario del destinatario.");
      return;
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Ingresa un monto válido, mayor a 0.");
      return;
    }

    if (!window.confirm(`¿Confirmas la transferencia de ${numericAmount} ${currency} a ${recipientUsername.trim()}?`)) {
      return;
    }

    setLoading(true);
    try {
      await transferApi(recipientUsername.trim(), currency, numericAmount);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "No se pudo procesar la transferencia.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-page">
      <div className="transfer-card">
        <h1 className="transfer-title">Enviar dinero</h1>
        <p className="transfer-subtitle">Transfiere saldo a otro usuario de Axora.</p>

        {success ? (
          <p className="transfer-success">Transferencia exitosa. Volviendo a tu cuenta…</p>
        ) : (
          <form onSubmit={handleSubmit} className="transfer-form" noValidate>
            <div className="form-field">
              <label className="form-label" htmlFor="recipient_username">
                Nombre de usuario del destinatario
              </label>
              <input
                id="recipient_username"
                className={`form-input${error ? " has-error" : ""}`}
                type="text"
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
              <div className="transfer-currency-row">
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
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={formatAmountInputDisplay(amount)}
                onChange={(e) => setAmount(parseAmountInputDisplay(e.target.value))}
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
                  {amount ? `${formatAmountInputDisplay(amount)} ${currency}` : `0,00 ${currency}`}
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
      </div>
    </div>
  );
}