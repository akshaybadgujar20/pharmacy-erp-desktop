import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { PermissionsGuard } from './permissions.guard';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  function createContext(user?: AuthenticatedUser): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext;
  }

  it('allows access when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('throws UNAUTHORIZED when user is missing', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['SALES:SALES_INVOICE:CREATE']);

    expect(() => guard.canActivate(createContext())).toThrow(
      ApplicationException,
    );

    try {
      guard.canActivate(createContext());
    } catch (error) {
      expect(error).toMatchObject({
        code: ErrorCode.UNAUTHORIZED,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }
  });

  it('allows access when user has required permission', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['SALES:SALES_INVOICE:CREATE']);

    const user: AuthenticatedUser = {
      userId: 1n,
      sessionUuid: 'session-uuid',
      companyId: 1n,
      branchId: 1n,
      roles: ['ADMIN'],
      permissions: ['SALES:SALES_INVOICE:CREATE'],
      username: 'admin',
    };

    expect(guard.canActivate(createContext(user))).toBe(true);
  });

  it('throws AUTH_PERMISSION_DENIED when permission is missing', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['SALES:SALES_INVOICE:CREATE']);

    const user: AuthenticatedUser = {
      userId: 1n,
      sessionUuid: 'session-uuid',
      companyId: 1n,
      branchId: 1n,
      roles: ['CASHIER'],
      permissions: ['SALES:SALES_INVOICE:READ'],
      username: 'cashier1',
    };

    expect(() => guard.canActivate(createContext(user))).toThrow(
      ApplicationException,
    );

    try {
      guard.canActivate(createContext(user));
    } catch (error) {
      expect(error).toMatchObject({
        code: ErrorCode.AUTH_PERMISSION_DENIED,
        statusCode: HttpStatus.FORBIDDEN,
      });
    }
  });

  it('reads permissions metadata from reflector', () => {
    const getAllAndOverride = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['INVENTORY:STOCK:READ']);

    const user: AuthenticatedUser = {
      userId: 1n,
      sessionUuid: 'session-uuid',
      companyId: 1n,
      branchId: 1n,
      roles: ['ADMIN'],
      permissions: ['INVENTORY:STOCK:READ'],
      username: 'admin',
    };

    guard.canActivate(createContext(user));

    expect(getAllAndOverride).toHaveBeenCalledWith(PERMISSIONS_KEY, [
      expect.anything(),
      expect.anything(),
    ]);
  });
});
