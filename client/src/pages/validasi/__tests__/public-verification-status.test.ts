import { describe, expect, it } from "vitest";
import { getPublicVerificationPresentation } from "../public-verification-status";

describe("public verification status", () => {
  it("allows the public SOP flow only for current documents", () => {
    expect(getPublicVerificationPresentation("CURRENT")).toMatchObject({
      variant: "success",
      statusLabel: "Berlaku",
      isCurrent: true,
    });
  });

  it.each([
    ["REVOKED", "Dicabut"],
    ["SUPERSEDED", "Digantikan"],
    ["NOT_PUBLIC", "Tidak tersedia publik"],
  ] as const)("keeps %s as historical, non-current evidence", (status, statusLabel) => {
    expect(getPublicVerificationPresentation(status)).toMatchObject({
      variant: "warning",
      statusLabel,
      isCurrent: false,
    });
  });
});
