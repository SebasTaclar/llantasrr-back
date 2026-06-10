import { Logger } from '../../shared/Logger';
import { ValidationError, NotFoundError } from '../../shared/exceptions';
import { IBrandDataSource } from '../../domain/interfaces/IBrandDataSource';
import { Brand } from '../../domain/entities/Brand';

export interface CreateBrandRequest {
  name: string;
  description?: string;
  logoUrl?: string;
}

export interface UpdateBrandRequest {
  name?: string;
  description?: string;
  logoUrl?: string;
}

export class BrandService {
  private logger: Logger;
  private brandDataSource: IBrandDataSource;

  constructor(logger: Logger, brandDataSource: IBrandDataSource) {
    this.logger = logger;
    this.brandDataSource = brandDataSource;
  }

  async getAllBrands(query?: unknown): Promise<Brand[]> {
    this.logger.logInfo('Getting all brands');

    try {
      const brands = await this.brandDataSource.getAll(query);
      this.logger.logInfo(`Retrieved ${brands.length} brands`);
      return brands;
    } catch (error) {
      this.logger.logError('Error getting brands', error);
      throw error;
    }
  }

  async getBrandById(id: string): Promise<Brand> {
    this.logger.logInfo(`Getting brand by id: ${id}`);

    if (!id) {
      throw new ValidationError('Brand ID is required');
    }

    const brandId = parseInt(id);
    if (isNaN(brandId)) {
      throw new ValidationError('Brand ID must be a valid number');
    }

    try {
      const brand = await this.brandDataSource.getById(brandId);

      if (!brand) {
        this.logger.logWarning(`Brand not found with id: ${id}`);
        throw new NotFoundError('Brand not found');
      }

      this.logger.logInfo(`Retrieved brand: ${brand.name}`);
      return brand;
    } catch (error) {
      this.logger.logError(`Error getting brand by id: ${id}`, error);
      throw error;
    }
  }

  async getBrandByName(name: string): Promise<Brand | null> {
    this.logger.logInfo(`Getting brand by name: ${name}`);

    if (!name) {
      throw new ValidationError('Brand name is required');
    }

    try {
      const brand = await this.brandDataSource.getByName(name);

      if (brand) {
        this.logger.logInfo(`Retrieved brand: ${brand.name}`);
      } else {
        this.logger.logInfo(`Brand not found with name: ${name}`);
      }

      return brand;
    } catch (error) {
      this.logger.logError(`Error getting brand by name: ${name}`, error);
      throw error;
    }
  }

  async createBrand(createRequest: CreateBrandRequest): Promise<Brand> {
    this.logger.logInfo(`Creating brand: ${createRequest.name}`);

    if (!createRequest.name) {
      throw new ValidationError('Brand name is required');
    }

    try {
      const existingBrand = await this.brandDataSource.getByName(createRequest.name);
      if (existingBrand) {
        this.logger.logWarning(
          `Brand creation failed: name '${createRequest.name}' already exists`
        );
        throw new ValidationError('Brand with this name already exists');
      }

      const brandData: Brand = {
        id: 0,
        name: createRequest.name,
        description: createRequest.description,
        logoUrl: createRequest.logoUrl,
      };

      const newBrand = await this.brandDataSource.create(brandData);
      this.logger.logInfo(
        `Brand created successfully: ${newBrand.name} (ID: ${newBrand.id})`
      );

      return newBrand;
    } catch (error) {
      this.logger.logError(`Error creating brand: ${createRequest.name}`, error);
      throw error;
    }
  }

  async updateBrand(id: string, updateRequest: UpdateBrandRequest): Promise<Brand> {
    this.logger.logInfo(`Updating brand with id: ${id}`);

    if (!id) {
      throw new ValidationError('Brand ID is required');
    }

    const brandId = parseInt(id);
    if (isNaN(brandId)) {
      throw new ValidationError('Brand ID must be a valid number');
    }

    if (!updateRequest.name && updateRequest.description === undefined && updateRequest.logoUrl === undefined) {
      throw new ValidationError(
        'At least one field (name, description or logoUrl) must be provided for update'
      );
    }

    try {
      const existingBrand = await this.brandDataSource.getById(brandId);
      if (!existingBrand) {
        this.logger.logWarning(`Brand update failed: brand not found with id ${id}`);
        throw new NotFoundError('Brand not found');
      }

      if (updateRequest.name && updateRequest.name !== existingBrand.name) {
        const brandWithSameName = await this.brandDataSource.getByName(updateRequest.name);
        if (brandWithSameName && brandWithSameName.id !== brandId) {
          this.logger.logWarning(
            `Brand update failed: name '${updateRequest.name}' already exists`
          );
          throw new ValidationError('Brand with this name already exists');
        }
      }

      const updatedBrand = await this.brandDataSource.update(brandId, updateRequest);

      if (!updatedBrand) {
        this.logger.logError(`Brand update failed: brand not found with id ${id}`);
        throw new NotFoundError('Brand not found');
      }

      this.logger.logInfo(`Brand updated successfully: ${updatedBrand.name} (ID: ${id})`);
      return updatedBrand;
    } catch (error) {
      this.logger.logError(`Error updating brand with id: ${id}`, error);
      throw error;
    }
  }

  async deleteBrand(id: string): Promise<boolean> {
    this.logger.logInfo(`Deleting brand with id: ${id}`);

    if (!id) {
      throw new ValidationError('Brand ID is required');
    }

    const brandId = parseInt(id);
    if (isNaN(brandId)) {
      throw new ValidationError('Brand ID must be a valid number');
    }

    try {
      const deleted = await this.brandDataSource.delete(brandId);

      if (!deleted) {
        this.logger.logWarning(`Brand deletion failed: brand not found with id ${id}`);
        throw new NotFoundError('Brand not found');
      }

      this.logger.logInfo(`Brand deleted successfully with id: ${id}`);
      return true;
    } catch (error) {
      this.logger.logError(`Error deleting brand with id: ${id}`, error);
      throw error;
    }
  }
}
