import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AlumniTable } from "@/components/alumni/AlumniTable";
import type { Alumni } from "@/types";

function makeAlumni(overrides: Partial<Alumni> = {}): Alumni {
  return {
    id: "alumni-1",
    nim: "2019.01.0023",
    nama_lengkap: "Alumni Test",
    prodi: "Teknik Informatika",
    tahun_masuk: 2019,
    tahun_lulus: 2023,
    ipk: 3.75,
    email: "alumni@example.com",
    no_hp: "08123456789",
    is_admin: false,
    created_at: "2026-05-21T00:00:00.000Z",
    updated_at: "2026-05-21T00:00:00.000Z",
    ...overrides
  };
}

describe("AlumniTable", () => {
  it("given alumni rows when rendered then it shows ipk column and value", () => {
    render(
      <AlumniTable
        rows={[makeAlumni()]}
        loading={false}
        selectedIds={[]}
        onSelectedIdsChange={vi.fn()}
        onDetail={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByRole("columnheader", { name: "IPK" })).toBeInTheDocument();
    expect(screen.getByText("3.75")).toBeInTheDocument();
  });
});
