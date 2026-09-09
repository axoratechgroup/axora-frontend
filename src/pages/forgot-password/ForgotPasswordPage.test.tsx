import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "react-toastify";

vi.mock("../../api/auth.api.ts", () => ({
  forgotPasswordApi: vi.fn(),
  checkEmailApi: vi.fn(),
}));

import { checkEmailApi, forgotPasswordApi } from "../../api/auth.api.ts";
import ForgotPasswordPage from "./ForgotPasswordPage.tsx";

const forgotPasswordApiMock = vi.mocked(forgotPasswordApi);
const checkEmailApiMock = vi.mocked(checkEmailApi);

function renderForgotPassword() {
  return render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(toast, "success").mockImplementation(() => "" as any);
    vi.spyOn(toast, "error").mockImplementation(() => "" as any);
  });

  it("renderiza el formulario con título y campo de correo sin botón manual de BD", () => {
    renderForgotPassword();

    expect(screen.getByRole("heading", { name: /Recuperar contraseña/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar enlace/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Verificar si está en BD/i })).not.toBeInTheDocument();
  });

  it("muestra error si se envía el formulario vacío", async () => {
    const user = userEvent.setup();
    renderForgotPassword();

    await user.click(screen.getByRole("button", { name: /Enviar enlace/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ingresa tu correo electrónico.");
    expect(forgotPasswordApiMock).not.toHaveBeenCalled();
    expect(checkEmailApiMock).not.toHaveBeenCalled();
  });

  it("muestra error si el formato del correo es inválido", async () => {
    const user = userEvent.setup();
    renderForgotPassword();

    await user.type(screen.getByLabelText(/Correo/i), "correo-invalido");
    await user.click(screen.getByRole("button", { name: /Enviar enlace/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El correo electrónico no tiene un formato válido.");
    expect(forgotPasswordApiMock).not.toHaveBeenCalled();
  });

  it("verifica el correo en vivo y muestra toast de éxito e ícono de validado cuando existe", async () => {
    const user = userEvent.setup();
    checkEmailApiMock.mockResolvedValueOnce({
      exists: true,
      first_name: "Camila",
      message: "Correo encontrado",
    });

    renderForgotPassword();

    const input = screen.getByLabelText(/Correo/i);
    await user.type(input, "camila@axora.test");

    await waitFor(() => {
      expect(checkEmailApiMock).toHaveBeenCalledWith("camila@axora.test");
    });

    expect(await screen.findByLabelText("Correo verificado")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Correo verificado"),
      expect.anything(),
    );
  });

  it("muestra toast de error e ícono de advertencia si el correo no existe en la base de datos", async () => {
    const user = userEvent.setup();
    checkEmailApiMock.mockRejectedValueOnce(
      new Error("El correo electrónico no se encuentra registrado en nuestro sistema."),
    );

    renderForgotPassword();

    const input = screen.getByLabelText(/Correo/i);
    await user.type(input, "inexistente@axora.test");

    await waitFor(() => {
      expect(checkEmailApiMock).toHaveBeenCalledWith("inexistente@axora.test");
    });

    expect(await screen.findByLabelText("Correo no registrado")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      "El correo electrónico no se encuentra registrado en nuestro sistema.",
      expect.anything(),
    );
  });

  it("envía solicitud exitosamente cuando el correo es verificado y existe", async () => {
    const user = userEvent.setup();
    checkEmailApiMock.mockResolvedValueOnce({
      exists: true,
      first_name: "Camila",
      message: "Correo encontrado",
    });
    forgotPasswordApiMock.mockResolvedValueOnce({
      message: "Enlace enviado exitosamente.",
    });

    renderForgotPassword();

    const input = screen.getByLabelText(/Correo/i);
    await user.type(input, "camila@axora.test");

    await waitFor(() => {
      expect(screen.getByLabelText("Correo verificado")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Enviar enlace/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(forgotPasswordApiMock).toHaveBeenCalledWith("camila@axora.test");
    });

    expect(
      await screen.findByText(/enlace para restablecer tu contraseña/i),
    ).toBeInTheDocument();
  });

  it("muestra error si el envío falla en el servidor", async () => {
    const user = userEvent.setup();
    checkEmailApiMock.mockResolvedValueOnce({
      exists: true,
      first_name: "Camila",
      message: "Correo encontrado",
    });
    forgotPasswordApiMock.mockRejectedValueOnce(
      new Error("Servicio de correo temporalmente no disponible"),
    );

    renderForgotPassword();

    const input = screen.getByLabelText(/Correo/i);
    await user.type(input, "camila@axora.test");

    await waitFor(() => {
      expect(screen.getByLabelText("Correo verificado")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Enviar enlace/i });
    await user.click(submitBtn);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Servicio de correo temporalmente no disponible",
    );
  });

  it("verifica automáticamente y detiene el envío si el correo no existe al presionar submit", async () => {
    const user = userEvent.setup();
    checkEmailApiMock.mockRejectedValue(
      new Error("El correo electrónico no se encuentra registrado en nuestro sistema."),
    );

    renderForgotPassword();

    const input = screen.getByLabelText(/Correo/i);
    await user.type(input, "inexistente@axora.test");

    const submitBtn = screen.getByRole("button", { name: /Enviar enlace/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(checkEmailApiMock).toHaveBeenCalledWith("inexistente@axora.test");
    });

    expect(forgotPasswordApiMock).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "El correo electrónico no se encuentra registrado en nuestro sistema.",
      expect.anything(),
    );
  });
});
