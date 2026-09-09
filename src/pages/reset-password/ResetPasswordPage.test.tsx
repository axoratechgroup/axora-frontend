import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/auth.api.ts", () => ({
  resetPasswordApi: vi.fn(),
}));

import { resetPasswordApi } from "../../api/auth.api.ts";
import ResetPasswordPage from "./ResetPasswordPage.tsx";

const resetPasswordApiMock = vi.mocked(resetPasswordApi);

function renderResetPassword(initialPath = "/reset-password?token=valid-token") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<p>Login Mock</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra error si no hay token en los parámetros de búsqueda", () => {
    renderResetPassword("/reset-password");

    expect(
      screen.getByText(/Este enlace no es válido. Solicita uno nuevo/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Guardar nueva contraseña/i })).not.toBeInTheDocument();
  });

  it("valida que la contraseña tenga al menos 8 caracteres", async () => {
    const user = userEvent.setup();
    renderResetPassword();

    await user.type(screen.getByLabelText("Nueva contraseña"), "12345");
    await user.type(screen.getByLabelText("Repetir contraseña"), "12345");
    await user.click(screen.getByRole("button", { name: /Guardar nueva contraseña/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La contraseña debe tener al menos 8 caracteres.",
    );
    expect(resetPasswordApiMock).not.toHaveBeenCalled();
  });

  it("valida que las contraseñas coincidan", async () => {
    const user = userEvent.setup();
    renderResetPassword();

    await user.type(screen.getByLabelText("Nueva contraseña"), "password123");
    await user.type(screen.getByLabelText("Repetir contraseña"), "password999");
    await user.click(screen.getByRole("button", { name: /Guardar nueva contraseña/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Las contraseñas no coinciden.",
    );
    expect(resetPasswordApiMock).not.toHaveBeenCalled();
  });

  it("actualiza la contraseña exitosamente y muestra mensaje de redirección", async () => {
    const user = userEvent.setup();
    resetPasswordApiMock.mockResolvedValueOnce({
      message: "Contraseña actualizada correctamente",
    });

    renderResetPassword();

    await user.type(screen.getByLabelText("Nueva contraseña"), "NewSecurePassword123!");
    await user.type(screen.getByLabelText("Repetir contraseña"), "NewSecurePassword123!");
    await user.click(screen.getByRole("button", { name: /Guardar nueva contraseña/i }));

    expect(resetPasswordApiMock).toHaveBeenCalledWith(
      "valid-token",
      "NewSecurePassword123!",
    );
    expect(
      await screen.findByText(/Contraseña actualizada. Redirigiendo al inicio de sesión…/i),
    ).toBeInTheDocument();
  });

  it("muestra error si la API rechaza el restablecimiento (por ejemplo token expirado)", async () => {
    const user = userEvent.setup();
    resetPasswordApiMock.mockRejectedValueOnce(
      new Error("El enlace de recuperación ha expirado"),
    );

    renderResetPassword();

    await user.type(screen.getByLabelText("Nueva contraseña"), "NewSecurePassword123!");
    await user.type(screen.getByLabelText("Repetir contraseña"), "NewSecurePassword123!");
    await user.click(screen.getByRole("button", { name: /Guardar nueva contraseña/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El enlace de recuperación ha expirado",
    );
  });

  it("muestra feedback en vivo con los requisitos de la contraseña", async () => {
    const user = userEvent.setup();
    renderResetPassword();

    await user.type(screen.getByLabelText("Nueva contraseña"), "Abc1!");

    expect(screen.getByText("Mínimo 8 caracteres (5/8)")).toBeInTheDocument();
    expect(screen.getByLabelText("Al menos una mayúscula (A-Z): cumplido")).toBeInTheDocument();
    expect(screen.getByLabelText("Al menos un número (0-9): cumplido")).toBeInTheDocument();
    expect(screen.getByLabelText("Al menos un carácter especial (!@#$...): cumplido")).toBeInTheDocument();
  });

  it("rechaza el envío si no cumple los requisitos de seguridad aunque tenga 8 caracteres", async () => {
    const user = userEvent.setup();
    renderResetPassword();

    await user.type(screen.getByLabelText("Nueva contraseña"), "solominisculas");
    await user.type(screen.getByLabelText("Repetir contraseña"), "solominisculas");
    await user.click(screen.getByRole("button", { name: /Guardar nueva contraseña/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La contraseña no cumple con todos los requisitos de seguridad.",
    );
    expect(resetPasswordApiMock).not.toHaveBeenCalled();
  });
});
