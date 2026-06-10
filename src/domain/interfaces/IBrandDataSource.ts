import { Brand } from '../entities/Brand';

export interface IBrandDataSource {
  getAll(query?: unknown): Promise<Brand[]>;
  getById(id: number): Promise<Brand | null>;
  getByName(name: string): Promise<Brand | null>;
  create(brand: Brand): Promise<Brand>;
  update(id: number, brand: Partial<Brand>): Promise<Brand | null>;
  delete(id: number): Promise<boolean>;
}
