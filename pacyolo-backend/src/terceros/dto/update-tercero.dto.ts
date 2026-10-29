import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTerceroDto } from './create-tercero.dto.js';

export class UpdateTerceroDto extends PartialType(
  OmitType(CreateTerceroDto, ['empresa_id'] as const),
) {}
