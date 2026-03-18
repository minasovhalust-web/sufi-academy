declare module 'socket.io' {
  export interface Server {
    to(room: string): any;
    emit(event: string, data?: any): any;
  }

  export interface Socket {
    id: string;
    handshake: {
      auth?: any;
      headers?: any;
    };
    data: any;
    join(room: string): Promise<void>;
    leave(room: string): Promise<void>;
    emit(event: string, data?: any): void;
    to(room: string): any;
    disconnect(): void;
  }
}
