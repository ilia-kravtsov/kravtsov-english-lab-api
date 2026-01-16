import { Request } from 'express';
import {CurrentUserPayload} from "./current-user.type";

export interface RequestWithUser extends Request {
  user: CurrentUserPayload;
}
