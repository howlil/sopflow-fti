import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma';

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diisi untuk FTI domain invariant audit`);
  return value;
};

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: required('DATABASE_HOST'),
    port: Number(process.env.DATABASE_PORT ?? '3306'),
    user: required('DATABASE_USER'),
    password: required('DATABASE_PASSWORD'),
    database: required('DATABASE_NAME'),
    connectionLimit: 2,
    connectTimeout: 15_000,
    allowPublicKeyRetrieval: true,
  }),
});

type CountRow = { count: number | bigint | string };

async function count(sql: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<CountRow[]>(sql);
  return Number(rows[0]?.count ?? 0);
}

async function run(): Promise<void> {
  const violations = {
    invalidWorkflowIdentity: await count(`
      SELECT COUNT(*) AS count
      FROM (
        SELECT p.ownerId AS penggunaId FROM Process p
        UNION ALL
        SELECT m.penggunaId FROM ProcessMember m
        UNION ALL
        SELECT a.holderId FROM OrganizationalAuthorityAssignment a
        UNION ALL
        SELECT o.penggunaId FROM ProcessOwnerAuthority o
      ) workflow_identity
      JOIN Pengguna u ON u.penggunaId = workflow_identity.penggunaId
      WHERE u.platformRole <> 'USER'
    `),
    activeSopWithoutProcess: await count(`
      SELECT COUNT(*) AS count
      FROM DetailSOP d
      JOIN SOP s ON s.sopId = d.sopId
      WHERE d.status IN ('DRAFT', 'PROCESS_REVIEW', 'REVISION_REQUIRED', 'FINAL_APPROVAL', 'TTE_PENDING')
        AND s.processId IS NULL
    `),
    invalidProcessReview: await count(`
      SELECT COUNT(*) AS count
      FROM ProcessReview r
      WHERE NOT (
        (r.decision = 'REVISION'
          AND r.previousStatus = 'PROCESS_REVIEW'
          AND r.nextStatus = 'REVISION_REQUIRED'
          AND r.catatan IS NOT NULL
          AND CHAR_LENGTH(TRIM(r.catatan)) > 0)
        OR
        (r.decision = 'ACCEPT'
          AND r.previousStatus = 'PROCESS_REVIEW'
          AND r.nextStatus = 'FINAL_APPROVAL')
      )
      OR NOT EXISTS (
        SELECT 1
        FROM DetailSOP d
        JOIN SOP s ON s.sopId = d.sopId
        JOIN Process p ON p.processId = r.processId
        WHERE d.detailSopId = r.detailSopId
          AND d.sopId = r.sopId
          AND s.processId = r.processId
          AND p.ownerId = r.reviewedById
      )
    `),
    invalidAuthorityAssignment: await count(`
      SELECT COUNT(*) AS count
      FROM OrganizationalAuthorityAssignment a
      WHERE NOT (
        (a.authority = 'DEAN'
          AND a.departmentId IS NULL
          AND a.authorityKey = 'DEAN')
        OR
        (a.authority = 'HEAD_OF_DEPARTMENT'
          AND a.departmentId IS NOT NULL
          AND a.authorityKey = CONCAT('HEAD_OF_DEPARTMENT:', a.departmentId))
      )
    `),
    invalidFinalApproval: await count(`
      SELECT COUNT(*) AS count
      FROM ProcessFinalApproval fa
      WHERE fa.processReviewId IS NULL
         OR NOT EXISTS (
           SELECT 1
           FROM ProcessReview r
           WHERE r.processReviewId = fa.processReviewId
             AND r.detailSopId = fa.detailSopId
             AND r.processId = fa.processId
             AND r.decision = 'ACCEPT'
             AND r.previousStatus = 'PROCESS_REVIEW'
             AND r.nextStatus = 'FINAL_APPROVAL'
         )
         OR NOT EXISTS (
           SELECT 1
           FROM OrganizationalAuthorityAssignment a
           JOIN Process p ON p.processId = fa.processId
           WHERE a.authorityKey = fa.authorityKey
             AND a.authority = fa.authority
             AND a.holderId = fa.approvedById
             AND (
               (p.scope = 'FACULTY'
                 AND p.departmentId IS NULL
                 AND fa.authority = 'DEAN'
                 AND a.departmentId IS NULL
                 AND a.authorityKey = 'DEAN')
               OR
               (p.scope = 'DEPARTMENT'
                 AND p.departmentId IS NOT NULL
                 AND fa.authority = 'HEAD_OF_DEPARTMENT'
                 AND a.departmentId = p.departmentId
                 AND a.authorityKey = CONCAT('HEAD_OF_DEPARTMENT:', p.departmentId))
             )
         )
    `),
    invalidTteProcessOwnership: await count(`
      SELECT COUNT(*) AS count
      FROM DokumenTte t
      WHERE NOT EXISTS (
        SELECT 1
        FROM DetailSOP d
        JOIN SOP s ON s.sopId = d.sopId
        WHERE d.detailSopId = t.detailSopId
          AND s.processId = t.processId
      )
    `),
  };

  console.log(JSON.stringify(violations, null, 2));

  const total = Object.values(violations).reduce((sum, value) => sum + value, 0);
  if (total > 0) {
    throw new Error(`FTI cross-table domain invariant violations ditemukan: ${total}`);
  }
}

run()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
