import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

export enum RoleEnum {
  USER = 'user',
}

export const RoleAuth = () => {
  @Injectable()
  export class RolesGuard implements CanActivate {
    public roles: Role[] = [];
    public userId = '';

    constructor(
      private reflector: Reflector,
      private authService: AuthService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }
      const ctx = GqlExecutionContext.create(context);
      const role = ctx.getContext().req.role;

      return requiredRoles.some(
        (requiredRole) => requiredRole.toLowerCase() === role.toLowerCase(),
      );
    }
  }
};
