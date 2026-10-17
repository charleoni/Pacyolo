import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePlantillaMapeoDto } from './create-plantilla-mapeo.dto.js';

export class UpdatePlantillaMapeoDto extends PartialType(
  OmitType(CreatePlantillaMapeoDto, ['empresa_id', 'codigo_concepto'] as const),
) {}
