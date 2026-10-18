import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsUrl,
  IsArray,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty({
    description: 'ID de la empresa tenant propietaria de la suscripción',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsNotEmpty()
  @IsUUID()
  empresa_id: string;

  @ApiProperty({
    description: 'Nombre descriptivo de la suscripción',
    example: 'Webhook ERP Comercial Principal',
  })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'URL de destino HTTPS a la cual se enviarán los eventos POST',
    example: 'https://mi-erp.com/api/webhooks/pacyolo',
  })
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  url_destino: string;

  @ApiPropertyOptional({
    description: 'Secreto compartido para firma criptográfica HMAC-SHA256 (si no se envía, se autogenera)',
    example: 'whsec_984128fba10928a',
  })
  @IsOptional()
  @IsString()
  secreto_firma?: string;

  @ApiProperty({
    description: 'Lista de eventos a los cuales se suscribe',
    example: ['factura_venta.aprobada', 'factura_venta.contabilizada', 'recaudo.contabilizado'],
  })
  @IsArray()
  @IsString({ each: true })
  eventos: string[];

  @ApiPropertyOptional({
    description: 'Estado activo o inactivo de la suscripción',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
