import { Module } from '@nestjs/common';
import { SopCatalogRepository } from './sop-catalog.repository';
import { SopWorkbenchReader } from './sop-workbench-reader.service';

/**
 * Native/read-only workbench boundary.
 * Deliberately does not import retired organization-scoped catalog providers.
 */
@Module({
  providers: [SopCatalogRepository, SopWorkbenchReader],
  exports: [SopCatalogRepository, SopWorkbenchReader],
})
export class SopWorkbenchModule {}
