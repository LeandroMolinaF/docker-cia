import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  BadRequestException,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: DatabaseService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();

    const key = req.headers['idempotency-key'] as string | undefined;
    if (!key)
      throw new BadRequestException('Idempotency-Key header is required');

    const endpoint = `${req.method} ${req.baseUrl || req.url}`;
    const userId = req.user?.sub;

    return from(this.prisma.idempotency.findUnique({ where: { key } })).pipe(
      mergeMap((hit) => {
        if (
          hit &&
          hit.endpoint === endpoint &&
          (!userId || userId === hit.userId)
        ) {
          return from(Promise.resolve(hit.response));
        }

        return next.handle().pipe(
          map(async (data) => {
            try {
              await this.prisma.idempotency.create({
                data: { key, endpoint, userId, response: data },
              });
            } catch (_) {}
            return data;
          }),
          mergeMap((p) => from(p)),
        );
      }),
    );
  }
}
