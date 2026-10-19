import { PartialType } from '@nestjs/swagger';
import { CreateTerceroDto } from './create-tercero.dto.js';

export class UpdateTerceroDto extends PartialType(CreateTerceroDto) {}
