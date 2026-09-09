import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  });

  it("renderiza el formulario con título y campo de correo", () => {
    renderForgotPassword();

    expect(screen.getByRole("heading", { name: /Recuperar contraseña/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar enlace/i })).toBeInTheDocument();
  });

  it("muestra error si se envía el formulario vacío", async () => {
    const user = userEvent.setup();
    renderForgotPassword();

    await user.click(screen.getByRole("button", { name: /Enviar enlace/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ingresa tu correo electrónico.");
    expect(forgotPasswordApiMock).not.toHaveBeenCalled();
  });

  it("envía solicitud exitosamente y muestra mensaje informativo de confirmación", async () => {
    const user = userEvent.setup();
    forgotPasswordApiMock.mockResolvedValueOnce({
      message: "Si el correo electrónico existe en nuestro sistema, recibirás un enlace.",
    });

    renderForgotPassword();

    await user.type(screen.getByLabelText(/Correo/i), "usuario@axora.test");
    await user.click(screen.getByRole("button", { name: /Enviar enlace/i }));

    expect(forgotPasswordApiMock).toHaveBeenCalledWith("usuario@axora.test");
    expect(
      await screen.findByText(/enlace para restablecer tu contraseña/i),
    ).toBeInTheDocument();
  });

  it("muestra error si la API responde con un fallo", async () => {
    const user = userEvent.setup();
    forgotPasswordApiMock.mockRejectedValueOnce(new Error("Servicio de correo temporalmente no disponible"));

    renderForgotPassword();

    await user.type(screen.getByLabelText(/Correo/i), "usuario@axora.test");
    await user.click(screen.getByRole("button", { name: /Enviar enlace/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Servicio de correo temporalmente no disponible",
    );
  });

  it("verifica en base de datos y muestra confirmación si el usuario existe", async () => {
    const user = userEvent.setup();
    checkEmailApiMock.mockResolvedValueOnce({
      exists: true,
      first_name: "Camila",
      message: "Correo encontrado",
    });

    renderForgotPassword();

    await user.type(screen.getByLabelText(/Correo/i), "camila@axora.test");
    await user.click(screen.getByRole("button", { name: /Verificar si está en BD/i }));

    expect(checkEmailApiMock).toHaveBeenCalledWith("camila@axora.test");
    expect(await screen.findByText(/Correo registrado en Axora/i)).toBeInTheDocument();
  });

  it("muestra error si el correo no existe al verificar en BD", async () => {
    const user = userEvent.setup();
    checkEmailApiMock.mockRejectedValueOnce(
      new Error("El correo electrónico no se encuentra registrado en nuestro sistema."),
    );

    renderForgotPassword();

    await user.type(screen.getByLabelText(/Correo/i), "inexistente@axora.test");
    await user.click(screen.getByRole("button", { name: /Verificar si está en BD/i }));

    expect(checkEmailApiMock).toHaveBeenCalledWith("inexistente@axora.test");
    expect(
      await screen.findByText("El correo electrónico no se encuentra registrado en nuestro sistema."),
    ).toBeInTheDocument();
  });
});
