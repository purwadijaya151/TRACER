import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AlumniModal } from "@/components/alumni/AlumniModal";

vi.mock("@/lib/actions/alumni.actions", () => ({
  createAlumni: vi.fn(async () => ({ data: null, error: null })),
  updateAlumni: vi.fn(async () => ({ data: null, error: null }))
}));

describe("AlumniModal", () => {
  it("shows validation errors for empty required fields", async () => {
    render(<AlumniModal open alumni={null} onClose={vi.fn()} onSaved={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /simpan/i }));

    await waitFor(() => {
      expect(screen.getByText(/NPM harus 5-20 karakter/i)).toBeInTheDocument();
      expect(screen.getByText(/Nama wajib diisi/i)).toBeInTheDocument();
    });
  });
});
