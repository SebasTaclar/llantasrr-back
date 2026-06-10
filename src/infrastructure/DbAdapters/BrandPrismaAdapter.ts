import { getPrismaClient } from '../../config/PrismaClient';
import { IBrandDataSource } from '../../domain/interfaces/IBrandDataSource';
import { Brand } from '../../domain/entities/Brand';
import { Prisma } from '@prisma/client';

export class BrandPrismaAdapter implements IBrandDataSource {
  private readonly prisma = getPrismaClient();

  public async getAll(query?: unknown): Promise<Brand[]> {
    let whereClause: Prisma.BrandWhereInput = {};

    if (query && typeof query === 'object') {
      const queryObj = query as Record<string, unknown>;

      whereClause = {
        ...(typeof queryObj.name === 'string' && {
          name: { contains: queryObj.name, mode: 'insensitive' as const },
        }),
        ...(typeof queryObj.description === 'string' && {
          description: { contains: queryObj.description, mode: 'insensitive' as const },
        }),
      };
    }

    const brands = await this.prisma.brand.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return brands as unknown as Brand[];
  }

  public async getById(id: number): Promise<Brand | null> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return brand as unknown as Brand | null;
  }

  public async getByName(name: string): Promise<Brand | null> {
    const brand = await this.prisma.brand.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!brand) return null;

    return {
      id: brand.id,
      name: brand.name,
      description: brand.description,
      logoUrl: brand.logoUrl,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    } as unknown as Brand;
  }

  public async create(brand: Brand): Promise<Brand> {
    const newBrand = await this.prisma.brand.create({
      data: {
        name: brand.name,
        description: brand.description,
        logoUrl: brand.logoUrl,
      },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return newBrand as Brand;
  }

  public async update(id: number, brand: Partial<Brand>): Promise<Brand | null> {
    try {
      const updatedBrand = await this.prisma.brand.update({
        where: { id },
        data: {
          ...(brand.name && { name: brand.name }),
          ...(brand.description !== undefined && { description: brand.description }),
          ...(brand.logoUrl !== undefined && { logoUrl: brand.logoUrl }),
        },
        select: {
          id: true,
          name: true,
          description: true,
          logoUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedBrand as Brand | null;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return null;
        }
      }
      throw error;
    }
  }

  public async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.brand.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return false;
        }
      }
      throw error;
    }
  }
}
