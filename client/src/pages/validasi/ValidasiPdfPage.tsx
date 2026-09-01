import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  FileUp,
  Home,
  Loader2,
  Shield,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { tteApi, usePdfSigningStatus } from "@/api/tte";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoCard } from "@/components/ui/info-card";
import { InfoField } from "@/components/ui/info-field";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ApiError } from "@/lib/api/api-client";
import type { PdfSignatureVerificationEntry, VerifyPdfResponse } from "@/types/dto/tte.dto";
import { ROUTES } from "@/utils/constants";
import { formatDateIdLong } from "@/utils/format-date";

const MAX_PDF_BYTES = 20 * 1024 * 1024;

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function formatDN(dn: string): string {
  const parts = dn.split(",").map((part) => part.trim());
  const dict: Record<string, string> = {};
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) {
      dict[key.toUpperCase()] = value;
    }
  }
  if (dict.CN && dict.O) {
    return `${dict.CN} (${dict.O})`;
  }
  return dict.CN ?? dn;
}

function PdfFilePicker({
  selectedFile,
  compact = false,
  onChange,
}: {
  selectedFile: File | null;
  compact?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      className={
        compact
          ? "flex cursor-pointer items-center gap-3 rounded-control border border-border bg-surface px-3 py-3 transition-colors hover:bg-surface-subtle focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
          : "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-surface border border-dashed border-border-strong bg-surface-subtle/60 px-4 py-10 text-center transition-colors hover:border-primary hover:bg-primary-subtle/30 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
      }
    >
      {selectedFile ? (
        <FileCheck2 className="h-6 w-6 shrink-0 text-primary" aria-hidden />
      ) : (
        <FileUp className="h-7 w-7 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <span className={compact ? "min-w-0 flex-1 text-left" : "min-w-0"}>
        <span className="block truncate text-sm font-medium text-foreground">
          {selectedFile ? selectedFile.name : "Pilih PDF untuk diverifikasi"}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {selectedFile ? "Klik untuk mengganti berkas" : "PDF · maksimum 20 MB"}
        </span>
      </span>
      <input
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-label={selectedFile ? "Ganti PDF" : "Pilih PDF"}
        onChange={onChange}
      />
    </label>
  );
}

function SignatureResultCard({ signature }: { signature: PdfSignatureVerificationEntry }) {
  const tteMatched = signature.valid && signature.tteMatch.matched;

  return (
    <section className="overflow-hidden rounded-surface border border-border bg-surface">
      <div className="space-y-3 border-b border-border px-4 py-3">
        <div className="flex items-start gap-2.5">
          {tteMatched ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-5 text-foreground">
              {tteMatched
                ? "TTE ini sudah cocok dengan signature PDF"
                : "TTE belum cocok dengan signature PDF"}
            </h3>
            <p className="mt-1 text-xs leading-5 text-secondary-foreground">
              {tteMatched
                ? "Signature PDF valid dan sesuai dengan riwayat TTE aplikasi."
                : signature.tteMatch.reason || signature.reason}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pl-6">
          <Badge variant={signature.valid ? "success" : "warning"} className="h-5 px-1.5 text-[10px]">
            {signature.valid ? "PDF valid" : "PDF bermasalah"}
          </Badge>
          <Badge variant={tteMatched ? "success" : "warning"} className="h-5 px-1.5 text-[10px]">
            {tteMatched ? "TTE cocok" : "TTE belum cocok"}
          </Badge>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        {!signature.valid ? (
          <InfoCard variant="warning" title="Alasan tidak valid" icon={<AlertCircle />}>
            <p className="text-foreground">{signature.reason}</p>
          </InfoCard>
        ) : null}

        <div className="grid gap-4">
          <InfoField label="Penandatangan" icon={<UserRound />} direction="vertical">
            {formatDN(signature.signerSubject)}
          </InfoField>
          <InfoField label="Diterbitkan oleh" icon={<Building2 />} direction="vertical">
            {formatDN(signature.signerIssuer)}
          </InfoField>
          <InfoField label="Waktu penandatanganan" icon={<CalendarClock />} direction="vertical">
            {signature.signedAt ? formatDateIdLong(signature.signedAt) : "Tidak tersedia di PDF"}
          </InfoField>
          {signature.tteMatch.ditandatanganiPada ? (
            <InfoField label="Waktu TTE aplikasi" icon={<CheckCircle2 />} direction="vertical">
              {formatDateIdLong(signature.tteMatch.ditandatanganiPada)}
            </InfoField>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function VerificationResult({ result }: { result: VerifyPdfResponse }) {
  if (!result.hasSignatures) {
    return (
      <InfoCard
        variant="warning"
        title="Tidak ada tanda tangan digital"
        icon={<AlertCircle className="h-4 w-4" />}
        className="text-sm"
      >
        <p className="text-foreground">
          PDF belum memuat signature digital yang bisa diverifikasi.
        </p>
      </InfoCard>
    );
  }

  return (
    <div className="space-y-3">
      {result.signatures.map((signature) => (
        <SignatureResultCard key={signature.index} signature={signature} />
      ))}
    </div>
  );
}

export function ValidasiPdfPage() {
  const statusQuery = usePdfSigningStatus();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyPdfResponse | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useDocumentTitle("Verifikasi tanda tangan PDF");

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (result || verifyError) {
      feedbackRef.current?.focus();
    }
  }, [result, verifyError]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setVerifyError(null);
    setResult(null);
  }, []);

  const handleVerify = useCallback(async () => {
    if (!selectedFile) {
      setVerifyError("Pilih berkas PDF terlebih dahulu.");
      return;
    }
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setVerifyError("Berkas harus berformat PDF.");
      return;
    }
    if (selectedFile.size > MAX_PDF_BYTES) {
      setVerifyError("Ukuran PDF melebihi batas 20 MB.");
      return;
    }

    setVerifyLoading(true);
    setVerifyError(null);
    setResult(null);
    try {
      const pdfBase64 = await fileToBase64(selectedFile);
      const response = await tteApi.verifyPdf(pdfBase64);
      setResult(response);
    } catch (error) {
      const serviceUnavailable =
        error instanceof ApiError && (error.status === 404 || error.status === 503);
      setVerifyError(
        serviceUnavailable
          ? "Layanan verifikasi PDF sedang tidak tersedia. Silakan coba beberapa saat lagi atau hubungi pengelola sistem."
          : "PDF belum dapat diverifikasi. Pastikan berkas dapat dibuka, lalu coba lagi.",
      );
    } finally {
      setVerifyLoading(false);
    }
  }, [selectedFile]);

  const verifyButton = (
    <Button
      type="button"
      className="w-full gap-2"
      disabled={verifyLoading || !selectedFile}
      onClick={() => void handleVerify()}
    >
      {verifyLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Shield className="h-4 w-4" aria-hidden />
      )}
      Verifikasi tanda tangan
    </Button>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="max-w-2xl">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary">
            <Shield className="h-4 w-4" aria-hidden />
            Verifikasi dokumen
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Verifikasi tanda tangan PDF
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-secondary-foreground">
            Periksa integritas signature digital dan kecocokannya dengan riwayat TTE SOPFlow.
          </p>
        </header>

        <div className="flex min-h-6 items-center gap-2 text-sm text-secondary-foreground" role="status">
          {statusQuery.isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              <span>Memuat status penandatanganan PDF...</span>
            </>
          ) : statusQuery.isSuccess ? (
            statusQuery.data.enabled ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                <span>Penandatanganan PDF aktif. Dokumen yang sudah disahkan dapat diverifikasi.</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-warning" aria-hidden />
                <span>Penandatanganan PDF sedang nonaktif. Verifikasi mungkin tidak tersedia.</span>
              </>
            )
          ) : null}
        </div>

        {!selectedFile ? (
          <section className="max-w-2xl space-y-4 rounded-surface border border-border bg-surface p-4 sm:p-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Unggah berkas PDF</h2>
              <p className="mt-1 text-xs leading-5 text-secondary-foreground">
                Berkas diproses untuk verifikasi signature dan tidak mengubah dokumen asli.
              </p>
            </div>
            <PdfFilePicker selectedFile={selectedFile} onChange={handleFileChange} />
            {verifyButton}
          </section>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <section className="overflow-hidden rounded-surface border border-border bg-surface">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Pratinjau lokal PDF</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  PDF
                </Badge>
              </div>
              <div className="min-h-[70vh] bg-surface-muted">
                {previewUrl ? (
                  <iframe
                    title={`Pratinjau PDF ${selectedFile.name}`}
                    src={previewUrl}
                    className="min-h-[70vh] w-full border-0 bg-surface"
                  />
                ) : (
                  <div className="flex min-h-[70vh] items-center justify-center text-secondary-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" aria-label="Memuat pratinjau PDF" />
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <section className="space-y-3 rounded-surface border border-border bg-surface p-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Dokumen</h2>
                  <p className="mt-1 text-xs leading-5 text-secondary-foreground">
                    Ganti berkas jika dokumen yang dipilih belum tepat.
                  </p>
                </div>
                <PdfFilePicker selectedFile={selectedFile} compact onChange={handleFileChange} />
                {verifyButton}
              </section>

              <div ref={feedbackRef} tabIndex={-1} className="space-y-3 focus:outline-none">
                {verifyError ? (
                  <div role="alert">
                    <InfoCard
                      variant="warning"
                      title="Verifikasi gagal"
                      icon={<AlertCircle className="h-4 w-4" />}
                      className="text-sm"
                    >
                      <p className="text-foreground">{verifyError}</p>
                    </InfoCard>
                  </div>
                ) : null}

                {result ? (
                  <div role="status" aria-live="polite">
                    <VerificationResult result={result} />
                  </div>
                ) : !verifyError ? (
                  <div className="rounded-surface border border-dashed border-border px-4 py-5 text-sm text-secondary-foreground">
                    Hasil verifikasi akan tampil di sini setelah dokumen diperiksa.
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        )}

        <div className="pt-1">
          <Button variant="outline" asChild className="gap-2">
            <Link to={ROUTES.HOME}>
              <Home className="h-4 w-4" aria-hidden />
              Kembali ke beranda
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
