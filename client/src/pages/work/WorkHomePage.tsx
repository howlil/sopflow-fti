import { Link } from "@tanstack/react-router";
import { FileText, ShieldCheck, Workflow, ArrowRight } from "lucide-react";
import { useMyProsesBisnises } from "@/api/konteks-proses-bisnis";
import { useProsesBisnisOwnerSelfService } from "@/api/penanggung-jawab-proses-bisnis";
import { useMyOrganizationalAuthorities } from "@/api/pejabat-berwenang";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useAuthStore } from "@/stores/authStore";
import { ROUTES } from "@/utils/constants";
import { PanelLayananMandiriPenanggungJawabProsesBisnis } from "./PanelLayananMandiriPenanggungJawabProsesBisnis";

function CapabilityCard({
  title,
  description,
  to,
  action,
  icon: Icon,
}: {
  title: string;
  description: string;
  to: string;
  action: string;
  icon: typeof FileText;
}) {
  return (
    <Card className="border-border shadow-surface">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3">
        <div className="rounded-control bg-primary-subtle p-2 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-secondary-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="gap-2">
          <Link to={to}>
            {action}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function WorkHomePage() {
  useDocumentTitle("Beranda Kerja");
  const user = useAuthStore((state) => state.user);
  const { data: prosesBisnis = [], isLoading: isLoadingProsesBisnises } = useMyProsesBisnises();
  const {
    scopes: ownerScopes,
    prosesBisnis: ownedProsesBisnises,
    isLoading: isLoadingOwnerContext,
  } = useProsesBisnisOwnerSelfService();
  const { data: authorities = [], isLoading: isLoadingAuthorities } =
    useMyOrganizationalAuthorities();

  const ownerCount = user ? prosesBisnis.filter((process) => process.penanggungJawabId === user.id).length : 0;
  const memberCount = Math.max(prosesBisnis.length - ownerCount, 0);
  const isLoading = isLoadingProsesBisnises || isLoadingAuthorities || isLoadingOwnerContext;
  const hasContextualCapability =
    prosesBisnis.length > 0 ||
    ownedProsesBisnises.length > 0 ||
    ownerScopes.length > 0 ||
    authorities.length > 0 ||
    user?.platformRole === "SUPER_ADMIN";

  return (
    <ListPageLayout title="Beranda Kerja" breadcrumb={null}>
      <section className="rounded-surface border border-border bg-surface p-4 shadow-surface sm:p-5">
        <p className="text-sm font-medium text-foreground">
          {user?.nama ? `Halo, ${user.nama}` : "Akses kerja FTI"}
        </p>
        <p className="mt-1 max-w-3xl text-sm text-secondary-foreground">
          Akses kerja mengikuti tanggung jawab Anda pada ProsesBisnis, kewenangan organisasi, dan
          administrasi platform.
        </p>
      </section>

      {isLoading ? (
        <div className="rounded-surface border border-border bg-surface p-5 text-sm text-secondary-foreground">
          Memuat konteks kerja…
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {prosesBisnis.length > 0 ? (
              <CapabilityCard
                title="Pekerjaan SOP"
                description={`${ownerCount} ProsesBisnis sebagai Owner · ${memberCount} sebagai Member. Draft, revisi, dan review yang memerlukan tindakan Anda tersedia dalam satu daftar kerja.`}
                to={ROUTES.WORK_QUEUE}
                action="Buka Pekerjaan SOP"
                icon={FileText}
              />
            ) : null}

            {authorities.length > 0 ? (
              <CapabilityCard
                title="Persetujuan & TTE"
                description={`${authorities.length} kewenangan organisasi aktif. Tinjau persetujuan akhir dan tanda tangani SOP sesuai kewenangan.`}
                to={ROUTES.APPROVAL.INBOX}
                action="Buka Persetujuan"
                icon={ShieldCheck}
              />
            ) : null}

            {user?.platformRole === "SUPER_ADMIN" ? (
              <CapabilityCard
                title="Administrasi FTI"
                description="Kelola struktur organisasi, eligibility Penanggung Jawab Proses Bisnis, dan penugasan kewenangan organisasi."
                to={ROUTES.ADMIN.PROCESSES}
                action="Buka Administrasi"
                icon={Workflow}
              />
            ) : null}

            {!hasContextualCapability ? (
              <div className="rounded-surface border border-dashed border-border bg-surface p-5 text-sm text-secondary-foreground">
                Akun ini belum memiliki penugasan ProsesBisnis, kewenangan organisasi, atau administrasi
                platform yang dapat digunakan.
              </div>
            ) : null}
          </div>

          {ownerScopes.length > 0 || ownedProsesBisnises.length > 0 ? (
            <PanelLayananMandiriPenanggungJawabProsesBisnis />
          ) : null}
        </>
      )}
    </ListPageLayout>
  );
}
