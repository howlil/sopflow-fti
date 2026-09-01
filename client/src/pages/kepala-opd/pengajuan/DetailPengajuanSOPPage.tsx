import { useMemo, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { CheckCircle, Loader2 } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { PengajuanCetakArsipButtons } from "@/components/pengajuan/PengajuanCetakArsipButtons";
import { usePengajuanCetakArsip } from "@/components/pengajuan/hooks/use-pengajuan-cetak-arsip";
import { buildSopArsipPdfBase64FromPreviewProps, canCetakBeritaAcaraPengajuan, canCetakSopArsipPengajuan } from "@/lib/print/pengajuan-print";
import { evaluasiApi, usePengajuanBeritaAcaraView, usePengajuanEvaluasiDetail, usePengajuanSopDokumenWorkbench } from "@/api/evaluasi";
import { useTandaTanganiSopPengajuan } from "@/api/tte";
import { mapPenyusunWorkbenchToPreviewProps } from "@/lib/sop/detailSop.mappers";
import { parseTTESignaturePayload } from "@/lib/tte/parse-tte-signature-payload";
import { DetailPageLayout } from "@/components/layout/DetailPageLayout";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { NotFoundWithBack } from "@/components/ui/not-found";
import { InlineHelperNote } from "@/components/ui/inline-helper-note";
import { BeritaAcaraPreviewPane } from "@/components/pengajuan/berita-acara-preview-pane";
import { DocumentPreviewTabs } from "@/components/pengajuan/document-preview-tabs";
import { SopDocumentPreviewPane } from "@/components/pengajuan/sop-document-preview-pane";
import { mapBeritaAcaraTemplateProps } from "@/lib/pengajuan/map-berita-acara-template-props";
import { PinVerificationDialog } from "@/components/tte/pin-verification-dialog";
import { TteSetupRequiredDialog } from "@/components/tte/tte-setup-required-dialog";
import { SopWorkbenchSidePanel } from "@/components/sop/sop-workbench-side-panel";
import { useRequireTteSetup } from "@/hooks/use-require-tte-setup";
import { useToast } from "@/hooks/useToast";
import { ROUTES } from "@/utils/constants";
import { PengajuanDetailSummaryHeader } from "./PengajuanDetailSummaryHeader";

const STATUS_SOP_SIAP_TTD_KEPALA_OPD = "DIVERIFIKASI_PJ_EVALUATOR_ORGANISASI";
const WORKBENCH_LOGS_LIMIT = 100;
type PengajuanDetail = NonNullable<ReturnType<typeof usePengajuanEvaluasiDetail>["pengajuan"]>;
type PengajuanSopList = NonNullable<PengajuanDetail["sopList"]>;
const EMPTY_SOP_LIST: PengajuanSopList = [];

export function DetailPengajuanSOPPage() {
  const { id } = useParams({ from: "/kepala-opd/pengajuan/$id" });

  const { pengajuan, loading } = usePengajuanEvaluasiDetail(id);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [selectedSopId, setSelectedSopId] = useState<string | null>(null);
  const [previewMainTab, setPreviewMainTab] = useState<"sop" | "ba">("sop");
  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  const allSopList = pengajuan?.sopList ?? EMPTY_SOP_LIST;
  const canCetakBa = canCetakBeritaAcaraPengajuan(pengajuan?.status);
  const canCetakSopArsip = canCetakSopArsipPengajuan(pengajuan?.status);
  const canSignAll = pengajuan?.status === "DITANDATANGANI_PJ_PENYUSUN";
  const isSudahBerlaku = pengajuan?.status === "SELESAI";
  const signableSopList = useMemo(
    () => allSopList.filter((item) => item.status === STATUS_SOP_SIAP_TTD_KEPALA_OPD),
    [allSopList],
  );
  const sopList = allSopList;
  const canShowSignAll = canSignAll && signableSopList.length > 0;
  const sopTidakEligibleCount = canSignAll ? allSopList.length - signableSopList.length : 0;
  const firstSopDetailId = sopList[0]?.sopDetailId ?? null;
  const effectiveSopDetailId = selectedSopId ?? firstSopDetailId;
  const selectedSop = sopList.find((item) => item.sopDetailId === effectiveSopDetailId) ?? null;

  const sopWorkbenchEnabled = Boolean(
    effectiveSopDetailId && (previewMainTab === "sop" || canCetakSopArsip),
  );
  const { data: sopDokumen, isFetching: sopWorkbenchLoading } = usePengajuanSopDokumenWorkbench(
    id,
    effectiveSopDetailId,
    { enabled: sopWorkbenchEnabled },
  );
  const sopPreviewProps = useMemo(() => {
    const wb = sopDokumen?.workbench;
    if (wb === undefined) return null;
    return mapPenyusunWorkbenchToPreviewProps(wb);
  }, [sopDokumen]);

  const tteSignaturePayloadKepalaOpd = useMemo(
    () => parseTTESignaturePayload(sopDokumen?.tteSignaturePayloadKepalaOpd),
    [sopDokumen?.tteSignaturePayloadKepalaOpd],
  );

  const baViewEnabled = Boolean(pengajuan && (previewMainTab === "ba" || canCetakBa));
  const { data: baView, isFetching: baViewLoading } = usePengajuanBeritaAcaraView(id, {
    enabled: baViewEnabled,
  });

  const baTemplateProps = useMemo(
    () =>
      pengajuan != null
        ? mapBeritaAcaraTemplateProps({ pengajuan, baView })
        : null,
    [pengajuan, baView],
  );

  const { handleCetak, cetakLoading } = usePengajuanCetakArsip({
    pengajuanId: id,
    pengajuan,
    effectiveSopDetailId,
    baTemplateProps,
    sopPreviewProps,
    tteSignaturePayload: tteSignaturePayloadKepalaOpd ?? null,
  });

  const {
    tteSetupDialogOpen,
    setTteSetupDialogOpen,
    requireTteReady,
    handleTteSigningError,
  } = useRequireTteSetup();
  const tandaTanganiSemuaSop = useTandaTanganiSopPengajuan({
    suppressSetupRequiredToast: true,
  });
  const { showToast } = useToast();
  const handlePinConfirm = async (pin: string): Promise<boolean> => {
    let signingRequestStarted = false;
    try {
      const sopPdfs = [];
      for (const sop of signableSopList) {
        const dokumen = await evaluasiApi.findPengajuanSopDokumen(
          id,
          sop.sopDetailId,
          WORKBENCH_LOGS_LIMIT,
        );
        sopPdfs.push({
          detailSopId: sop.sopDetailId,
          pdfBase64: await buildSopArsipPdfBase64FromPreviewProps(
            mapPenyusunWorkbenchToPreviewProps(dokumen.workbench),
          ),
        });
      }
      signingRequestStarted = true;
      await tandaTanganiSemuaSop.mutateAsync({
        pengajuanId: id,
        payload: {
          pin,
          nomorDokumen: pengajuan?.nomorBA ?? `PGJ-${pengajuan?.opdNama ?? ""}`,
          judulDokumen: `Pengesahan SOP OPD - ${pengajuan?.opdNama ?? ""}`,
          sopPdfs,
        },
      });
      return true;
    } catch (error) {
      handleTteSigningError(error, () => setPinDialogOpen(false));
      if (!signingRequestStarted) {
        showToast(
          error instanceof Error ? error.message : "Gagal membuat PDF resmi SOP.",
          "error",
        );
      }
      return false;
    }
  };
  const handleOpenPinDialog = () => {
    void requireTteReady(() => setPinDialogOpen(true));
  };

  if (loading && pengajuan === null) {
    return (
      <LoadingState className="min-h-[320px]" message="Memuat detail pengajuan SOP…" />
    );
  }

  if (pengajuan === null) {
    return (
      <NotFoundWithBack
        message="Pengajuan SOP tidak ditemukan."
        backAction={
          <BackButton to={ROUTES.KEPALA_OPD.PENGAJUAN}>
            Kembali
          </BackButton>
        }
      />
    );
  }

  const opdName = pengajuan.opdNama ?? pengajuan.opd?.nama ?? "—";
  const statusLabel = pengajuan.statusLabel ?? pengajuan.status;
  const workbenchSopItems = sopList.map((item) => ({
    id: item.sopDetailId,
    nama: item.nama,
    nomor: item.nomor,
    statusDokumen: item.status,
    statusDokumenLabel: item.statusLabel ?? item.status,
    hasilEvaluasi: item.hasil,
    hasilEvaluasiLabel: item.hasilLabel,
  }));

  return (
    <>
      <DetailPageLayout
        breadcrumb={[
          { label: "Pengajuan SOP", to: ROUTES.KEPALA_OPD.PENGAJUAN },
          { label: "Detail Pengajuan" },
        ]}
        title="Detail Pengajuan SOP"
        header={
          <div className="space-y-3">
            <PengajuanDetailSummaryHeader
              opdName={opdName}
              jenis={pengajuan.jenis}
              nomorBA={pengajuan.nomorBA}
              tanggalTTDBaPjPenyusun={pengajuan.tanggalTTDBaPjPenyusun}
              sopCount={allSopList.length}
              status={pengajuan.status}
              statusLabel={statusLabel}
              actions={
                <>
                  <PengajuanCetakArsipButtons
                    printScope="pj-penyusun-kepala-opd"
                    pengajuanStatus={pengajuan.status}
                    effectiveSopDetailId={effectiveSopDetailId}
                    sopCount={allSopList.length}
                    cetakLoading={cetakLoading}
                    onCetak={handleCetak}
                  />
                  {canShowSignAll && (
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={handleOpenPinDialog}
                      disabled={tandaTanganiSemuaSop.isPending}
                    >
                      {tandaTanganiSemuaSop.isPending ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Menandatangani...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" />
                          Tanda Tangan Semua SOP
                        </>
                      )}
                    </Button>
                  )}
                </>
              }
            />
            {!canSignAll && !isSudahBerlaku && (
              <InlineHelperNote tone="warning" label="Belum siap TTE">
                Pengajuan harus berstatus ditandatangani PJ Penyusun sebelum disahkan Kepala OPD.
              </InlineHelperNote>
            )}
            {canSignAll && sopTidakEligibleCount > 0 && (
              <InlineHelperNote tone="warning" label="Sebagian SOP tidak perlu TTD ulang">
                {sopTidakEligibleCount} dari {allSopList.length} SOP tidak masuk payload tanda tangan karena statusnya bukan {STATUS_SOP_SIAP_TTD_KEPALA_OPD}. SOP tetap ditampilkan untuk pratinjau.
              </InlineHelperNote>
            )}
          </div>
        }
        leftPanel={
          <SopWorkbenchSidePanel
            collapsed={leftPanelCollapsed}
            onCollapse={() => setLeftPanelCollapsed(true)}
            onExpand={() => setLeftPanelCollapsed(false)}
            items={workbenchSopItems}
            selectedId={effectiveSopDetailId}
            onSelect={setSelectedSopId}
          />
        }
      >
        <div className="flex h-full min-h-0 min-w-0 flex-col">
          <DocumentPreviewTabs
            value={previewMainTab}
            onValueChange={setPreviewMainTab}
            tabs={[
              {
                value: "sop",
                label: "Pratinjau SOP",
                contentClassName: "mt-2 flex min-h-0 flex-1 flex-col overflow-auto px-2 pb-2",
                content: (
                  <SopDocumentPreviewPane
                    selectedSop={selectedSop}
                    isLoading={sopWorkbenchLoading}
                    sopPreviewProps={sopPreviewProps}
                    tteSignaturePayload={tteSignaturePayloadKepalaOpd ?? null}
                  />
                ),
              },
              {
                value: "ba",
                label: "Pratinjau Berita Acara",
                contentClassName: "mt-2 flex min-h-0 flex-1 flex-col overflow-auto px-1 pb-1 sm:px-2",
                content:
                  baTemplateProps != null ? (
                    <BeritaAcaraPreviewPane
                      isLoading={baViewLoading}
                      templateProps={baTemplateProps}
                    />
                  ) : null,
              },
            ]}
          />
        </div>
      </DetailPageLayout>

      <PinVerificationDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        title="Tanda Tangan — PIN TTE"
        description="Masukkan PIN TTE untuk menandatangani seluruh SOP pada pengajuan ini."
        onConfirm={handlePinConfirm}
        confirmLabel="Tanda Tangani"
      />
      <TteSetupRequiredDialog
        open={tteSetupDialogOpen}
        onOpenChange={setTteSetupDialogOpen}
      />
    </>
  );
}
