import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tercero, TipoIdentificacion } from './entities/tercero.entity.js';
import { CreateTerceroDto } from './dto/create-tercero.dto.js';
import { calcularDigitoVerificacion } from '../common/utils/dian-nit.util.js';

@Injectable()
export class TercerosService {
  constructor(
    @InjectRepository(Tercero)
    private readonly terceroRepo: Repository<Tercero>,
  ) {}

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

    const nuevo = this.terceroRepo.create({
      ...dto,
      numero_identificacion: numId,
      digito_verificacion: dv,
    });

    return await this.terceroRepo.save(nuevo);
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
