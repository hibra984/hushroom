import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DriftService } from './drift.service';

@WebSocketGateway({ namespace: '/ws/drift', cors: { origin: '*' } })
export class DriftGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly driftService: DriftService) {}

  handleConnection(client: Socket) {
    // Client connected to drift namespace
  }

  handleDisconnect(client: Socket) {
    // Client disconnected from drift namespace
  }

  @SubscribeMessage('join-session')
  handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    client.join(data.sessionId);
    return { event: 'joined', sessionId: data.sessionId };
  }

  @SubscribeMessage('leave-session')
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    client.leave(data.sessionId);
    return { event: 'left', sessionId: data.sessionId };
  }

  @SubscribeMessage('companion-drift-flag')
  async handleCompanionDriftFlag(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; message: string; severity?: string },
  ) {
    const driftLog = await this.driftService.createDriftAlert(data.sessionId, {
      severity: data.severity ?? 'MEDIUM',
      message: data.message,
      triggerType: 'manual',
    });

    this.emitDriftAlert(data.sessionId, driftLog);

    return driftLog;
  }

  @SubscribeMessage('drift-acknowledge')
  async handleDriftAcknowledge(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { driftLogId: string; userId: string },
  ) {
    const driftLog = await this.driftService.acknowledgeDrift(
      data.driftLogId,
      data.userId,
    );

    this.emitDriftAcknowledged(driftLog.sessionId, driftLog);

    return driftLog;
  }

  emitDriftAlert(sessionId: string, driftLog: any) {
    this.server.to(sessionId).emit('drift-alert', driftLog);
  }

  emitDriftAcknowledged(sessionId: string, driftLog: any) {
    this.server.to(sessionId).emit('drift-acknowledged', driftLog);
  }
}
