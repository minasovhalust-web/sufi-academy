import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * WsJwtGuard — WebSocket equivalent of the HTTP JwtAuthGuard.
 *
 * This guard does NOT verify the JWT itself — that happens in
 * ChatGateway.handleConnection() where unauthorized clients are disconnected.
 *
 * This guard's only responsibility is to confirm that client.data.user
 * was successfully populated during handleConnection, providing a
 * defence-in-depth check on individual event handlers.
 *
 * Usage:
 *   @UseGuards(WsJwtGuard)
 *   @SubscribeMessage('send-message')
 *   async handleSendMessage(...) { ... }
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();

    if (!client.data?.user) {
      throw WsException('Unauthorized: please reconnect with a valid token');
    }

    return true;
  }
}
