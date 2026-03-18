declare module '@nestjs/websockets' {
  import { Type } from '@nestjs/common';
  import { Server, Socket } from 'socket.io';

  export function WebSocketGateway(
    options?: WebSocketGatewayOptions,
  ): ClassDecorator;

  export interface WebSocketGatewayOptions {
    namespace?: string;
    cors?: any;
  }

  export function WebSocketServer(): PropertyDecorator;

  export interface OnGatewayConnection {
    handleConnection(client: any): any;
  }

  export interface OnGatewayDisconnect {
    handleDisconnect(client: any): any;
  }

  export function SubscribeMessage(message: string): MethodDecorator;

  export function ConnectedSocket(): ParameterDecorator;

  export function MessageBody(): ParameterDecorator;

  export function WsException(message: string): WsExceptionError;

  export class WsExceptionError extends Error {
    constructor(message: string);
  }

  export function UseFilters(...filters: any[]): MethodDecorator | ClassDecorator;
}
