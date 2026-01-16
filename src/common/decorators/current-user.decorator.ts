import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {CurrentUserPayload} from "../types/current-user.type";
import {RequestWithUser} from "../types/request-with-user";

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return data ? user[data] : user;
  },
);