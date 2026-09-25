import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PayloadToken } from '@/common/types/types';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PayloadToken => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
