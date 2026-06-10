import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getBrandService } from '../src/shared/serviceProvider';
import { withApiHandler } from '../src/shared/apiHandler';
import { AuthenticatedUser } from '../src/shared/authMiddleware';
import { validateAuthToken } from '../src/shared/authHelper';

const funcBrands = async (
  _context: Context,
  req: HttpRequest,
  log: Logger
): Promise<unknown> => {
  const brandService = getBrandService(log);
  const method = req.method?.toUpperCase();
  const brandId = req.params?.id;

  // GET /v1/brands (sin ID) es público
  if (method === 'GET' && !brandId) {
    log.logInfo('Processing GET request for brands (public)');
    const brands = await brandService.getAllBrands(req.query);
    return ApiResponseBuilder.success(
      {
        count: brands.length,
        brands: brands,
      },
      'Brands retrieved successfully'
    );
  }

  // Para GET por ID y demás métodos, requiere autenticación
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader) {
    log.logError('Authentication failed: Missing authorization header');
    return ApiResponseBuilder.error('Unauthorized: Missing authorization header', 401);
  }

  try {
    const token = validateAuthToken(authHeader);
    const { verifyToken } = await import('../src/shared/jwtHelper');
    const userPayload = verifyToken(token);

    const user: AuthenticatedUser = {
      id: userPayload.id,
      email: userPayload.email,
      name: userPayload.name,
      role: userPayload.role,
      membershipPaid: userPayload.membershipPaid,
    };

    log.logInfo(`User authenticated successfully: ${user.email}`);

    // GET /v1/brands/{id} - Obtener marca por ID (autenticado)
    if (method === 'GET' && brandId) {
      log.logInfo(`Processing GET request for brand by id: ${brandId}`);
      const brand = await brandService.getBrandById(brandId);
      return ApiResponseBuilder.success(brand, 'Brand retrieved successfully');
    }

    log.logInfo(`Processing ${method} request for brands (authenticated)`, {
      brandId,
      userId: user.id,
    });

    switch (method) {
      case 'POST': {
        if (brandId) {
          return ApiResponseBuilder.validationError([
            'ID should not be provided when creating a brand',
          ]);
        }
        const newBrand = await brandService.createBrand(req.body);
        return ApiResponseBuilder.success(newBrand, 'Brand created successfully');
      }

      case 'PUT': {
        if (!brandId) {
          return ApiResponseBuilder.validationError(['Brand ID is required for update']);
        }
        const updatedBrand = await brandService.updateBrand(brandId, req.body);
        return ApiResponseBuilder.success(updatedBrand, 'Brand updated successfully');
      }

      case 'DELETE':
        if (!brandId) {
          return ApiResponseBuilder.validationError(['Brand ID is required for deletion']);
        }
        await brandService.deleteBrand(brandId);
        return ApiResponseBuilder.success(null, 'Brand deleted successfully');

      default:
        return ApiResponseBuilder.validationError([`HTTP method ${method} not supported`]);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    log.logError(`Authentication failed: ${errorMessage}`);

    if (
      errorMessage.toLowerCase().includes('unauthorized') ||
      errorMessage.toLowerCase().includes('invalid token')
    ) {
      return ApiResponseBuilder.error('Unauthorized: Invalid or expired token', 401);
    }

    return ApiResponseBuilder.error(`Error: ${errorMessage}`, 500);
  }
};

export default withApiHandler(funcBrands);
