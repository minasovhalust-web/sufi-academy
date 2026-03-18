import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

/**
 * WsJwtGuard — WebSocket authentication guard for LiveGateway.
 *
 * Confirms that client.data.user was populated during handleConnection.
 * Primary authentication (JWT verification + disconnect) happens in
 * LiveGateway.handleConnection(); this guard is a defence-in-depth check
 * on individual event handlers.
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    if (!client.data?.user) {
      // Emit exception directly instead of throwing
      client.emit('exception', {
        message: 'Unauthorized: please reconnect with a valid token',
      });
      return false;
    }
    return true;
  }
}
