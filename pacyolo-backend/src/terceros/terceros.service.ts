import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tercero, TipoIdentificacion } from './entities/tercero.entity.js';
import { CreateTerceroDto } from './dto/create-tercero.dto.js';
import { UpdateTerceroDto } from './dto/update-tercero.dto.js';
import { calcularDigitoVerificacion } from '../common/utils/dian-nit.util.js';

@Injectable()
export class TercerosService {
  constructor(
    @InjectRepository(Tercero)
    private readonly terceroRepo: Repository<Tercero>,
  ) {}

  private resolverNombreCompleto(dto: any): string {
    if (dto.razon_social && dto.razon_social.trim().length > 0) {
      return dto.razon_social.trim();
    }
    const nombres = [dto.primer_nombre, dto.otros_nombres, dto.primer_apellido, dto.segundo_apellido]
      .filter(Boolean)
      .map((s) => (s as string).trim());
    if (nombres.length > 0) {
      return nombres.join(' ');
    }
    return dto.nombre_completo ? dto.nombre_completo.trim() : 'Sin Nombre';
  }

  async create(dto: CreateTerceroDto): Promise<Tercero> {
    const numId = dto.numero_identificacion.trim();

    const existe = await this.terceroRepo.findOne({
      where: {
        empresa_id: dto.empresa_id,
        numero_identificacion: numId,
      },
    });

    if (existe) {
      throw new ConflictException(
        `Ya existe un tercero con la identificación ${numId} en esta empresa`,
      );
    }

    let dv = dto.digito_verificacion;
    if (dto.tipo_identificacion === TipoIdentificacion.NIT && dv === undefined) {
      dv = calcularDigitoVerificacion(numId);
    }

    const nombreFinal = this.resolverNombreCompleto(dto);

    const nuevo = this.terceroRepo.create({
      ...dto,
      numero_identificacion: numId,
      nombre_completo: nombreFinal,
      pais_codigo: dto.pais_codigo || 'CO',
      digito_verificacion: dv,
    });

    return await this.terceroRepo.save(nuevo);
  }

  async update(id: string, dto: UpdateTerceroDto): Promise<Tercero> {
    const tercero = await this.findOne(id);

    if (dto.numero_identificacion) {
      const numId = dto.numero_identificacion.trim();
      if (numId !== tercero.numero_identificacion) {
        const existe = await this.terceroRepo.findOne({
          where: { empresa_id: tercero.empresa_id, numero_identificacion: numId },
        });
        if (existe && existe.id !== id) {
          throw new ConflictException(`Ya existe un tercero con la identificación ${numId} en esta empresa`);
        }
        tercero.numero_identificacion = numId;
        if ((dto.tipo_identificacion || tercero.tipo_identificacion) === TipoIdentificacion.NIT) {
          tercero.digito_verificacion = calcularDigitoVerificacion(numId);
        }
      }
    }

    Object.assign(tercero, dto);

    if (
      dto.razon_social !== undefined ||
      dto.primer_nombre !== undefined ||
      dto.primer_apellido !== undefined ||
      dto.nombre_completo !== undefined
    ) {
      tercero.nombre_completo = this.resolverNombreCompleto(tercero);
    }

    return await this.terceroRepo.save(tercero);
  }

  async findOrCreate(dto: CreateTerceroDto): Promise<Tercero> {
    const numId = dto.numero_identificacion.trim();

    let tercero = await this.terceroRepo.findOne({
      where: {
        empresa_id: dto.empresa_id,
        numero_identificacion: numId,
      },
    });

    if (!tercero) {
      tercero = await this.create(dto);
    }

    return tercero;
  }

  async findByEmpresa(empresaId: string): Promise<Tercero[]> {
    return await this.terceroRepo.find({
      where: { empresa_id: empresaId, activo: true },
      order: { nombre_completo: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Tercero> {
    const tercero = await this.terceroRepo.findOne({ where: { id } });
    if (!tercero) {
      throw new NotFoundException(`Tercero con ID ${id} no encontrado`);
    }
    return tercero;
  }

  async findByDocumento(
    empresaId: string,
    numeroIdentificacion: string,
  ): Promise<Tercero | null> {
    return await this.terceroRepo.findOne({
      where: {
        empresa_id: empresaId,
        numero_identificacion: numeroIdentificacion.trim(),
      },
    });
  }
}
