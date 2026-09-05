import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../api/wallet.api.ts", () => ({
  topupApi: vi.fn(),
}));

import { topupApi } from "../../api/wallet.api.ts";
import TopUpPage from "./TopUpPage.tsx";

const topupApiMock = vi.mocked(topupApi);

function renderTopUp() {
  return render(
    <MemoryRouter initialEntries={["/topup"]}>
      <Routes>
        <Route path="/topup" element={<TopUpPage />} />
        <Route path="/dashboard" element={<p>Dashboard Mock</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("TopUpPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra error si el monto es inválido o menor a 0", async () => {
    const user = userEvent.setup();
    renderTopUp();

    await user.click(screen.getByRole("button", { name: "Cargar saldo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ingresa un monto válido, mayor a 0.",
    );
    expect(topupApiMock).not.toHaveBeenCalled();
  });

  it("no ejecuta la carga si se cancela la confirmación", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    renderTopUp();

    await user.type(screen.getByLabelText("Monto"), "100");
    await user.click(screen.getByRole("button", { name: "Cargar saldo" }));

    expect(window.confirm).toHaveBeenCalled();
    expect(topupApiMock).not.toHaveBeenCalled();
  });

  it("muestra error si la API rechaza la carga (ej. límite de USD superado)", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    topupApiMock.mockRejectedValueOnce(
      new Error("superarías el límite de USD 10000 en tu cuenta"),
    );
    renderTopUp();

    await user.type(screen.getByLabelText("Monto"), "1000");
    await user.click(screen.getByRole("button", { name: "Cargar saldo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "superarías el límite de USD 10000",
    );
  });

  it("procesa la carga exitosamente y muestra mensaje", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    topupApiMock.mockResolvedValueOnce({
      id: "tx-topup",
      type: "TOP_UP",
    } as any);
    renderTopUp();

    await user.type(screen.getByLabelText("Monto"), "50");
    await user.click(screen.getByRole("button", { name: "Cargar saldo" }));

    expect(topupApiMock).toHaveBeenCalledWith(expect.any(String), 50);
    expect(
      await screen.findByText(/Carga exitosa/i),
    ).toBeInTheDocument();
  });
});
