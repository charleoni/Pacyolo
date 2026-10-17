import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateImpuestoReglaDto } from './create-impuesto-regla.dto.js';

export class UpdateImpuestoReglaDto extends PartialType(
  OmitType(CreateImpuestoReglaDto, ['empresa_id', 'codigo'] as const),
) {}
