import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import amqp from 'amqplib';

import { RABBITMQ_CONNECTION, RABBITMQ_CHANNEL } from './rmq.constants';
import { RmqService } from './rmq.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: RABBITMQ_CONNECTION,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return await amqp.connect(
          configService.getOrThrow<string>('RABBITMQ_URL'),
        );
      },
    },
    {
      provide: RABBITMQ_CHANNEL,
      inject: [RABBITMQ_CONNECTION],
      useFactory: async (conn: amqp.ChannelModel) => {
        const channel = await conn.createChannel();

        await channel.prefetch(1);

        return channel;
      },
    },
    RmqService,
  ],
  exports: [RmqService],
})
export class RmqModule {}
