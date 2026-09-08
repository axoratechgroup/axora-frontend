import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/auth.api.ts", () => ({
  forgotPasswordApi: vi.fn(),
}));

import { forgotPasswordApi } from "../../api/auth.api.ts";
import ForgotPasswordPage from "./ForgotPasswordPage.tsx";

const forgotPasswordApiMock = vi.mocked(forgotPasswordApi);

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
      await screen.findByText(/recibirás un enlace para restablecer tu contraseña/i),
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
});
