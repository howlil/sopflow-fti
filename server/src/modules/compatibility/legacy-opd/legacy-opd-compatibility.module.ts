import { Module } from '@nestjs/common';
import { EvaluatorModule } from '../../core/evaluator/evaluator.module';
import { KepalaOpdModule } from '../../core/kepala-opd/kepala-opd.module';
import { OpdModule } from '../../core/opd/opd.module';
import { PenyusunModule } from '../../core/penyusun/penyusun.module';

/**
 * Explicit compatibility boundary for pre-FTI OPD administration APIs.
 *
 * Native FTI modules must never import this module. These controllers remain
 * mounted only so historical/external consumers are not destroyed as part of
 * the semantic first-party cutover. They are not product ownership or workflow
 * authority for Process-bound SOPs.
 */
@Module({
  imports: [OpdModule, EvaluatorModule, KepalaOpdModule, PenyusunModule],
})
export class LegacyOpdCompatibilityModule {}
