import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './roles.decorator';
import { RolesGuard } from '@/guards/roles.guards';

export function Authenticated(...roles: string[]) {
  const decorators = [UseGuards(AuthGuard('jwt'), RolesGuard)];

  if (roles.length) {
    decorators.push(Roles(...roles));
  }

  return applyDecorators(...decorators);
}
