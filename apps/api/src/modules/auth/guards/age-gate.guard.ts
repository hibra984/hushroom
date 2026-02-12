import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AgeGateGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user?.isAgeVerified) {
      throw new ForbiddenException('Age verification required before accessing this resource');
    }

    return true;
  }
}
