import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import amqp from 'amqplib';

import {
  RABBITMQ_CHANNEL,
  RABBITMQ_CONNECTION,
  RMQ_MAX_RETRIES,
} from './rmq.constants';

@Injectable()
export class RmqService implements OnModuleDestroy {
  private readonly logger = new Logger(RmqService.name);

  constructor(
    @Inject(RABBITMQ_CHANNEL)
    private readonly channel: amqp.Channel,

    @Inject(RABBITMQ_CONNECTION)
    private readonly connection: amqp.ChannelModel,
  ) {}

  private retryEventLogger?: (data: {
    retryCount: number;
    error: string;
    paymentRequestId: string;
    finalFail: boolean;
  }) => Promise<void>;

  setRetryLogger(
    fn: (data: {
      retryCount: number;
      error: string;
      paymentRequestId: string;
      finalFail: boolean;
    }) => Promise<void>,
  ) {
    this.retryEventLogger = fn;
  }

  async publish<T>(queue: string, message: T): Promise<void> {
    await this.channel.assertQueue(queue, {
      durable: true,
    });

    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,

      headers: {
        retryCount: 0,
      },
    });
  }

  async consume<T>(
    queue: string,

    handler: (data: T) => Promise<void>,
  ) {
    await this.channel.assertQueue(queue, {
      durable: true,
    });

    this.channel.consume(
      queue,

      async (msg) => {
        if (!msg) {
          return;
        }
        let data: T | null = null;
        try {
          data = JSON.parse(msg.content.toString()) as T;

          await handler(data);

          this.channel.ack(msg);
        } catch (error) {
          const retryCount = Number(msg.properties.headers?.retryCount ?? 0);

          if (retryCount >= RMQ_MAX_RETRIES) {
            this.logger.error(`Message exceeded max retries`);

            if (this.retryEventLogger) {
              await this.retryEventLogger({
                retryCount: RMQ_MAX_RETRIES,
                error: error?.message ?? 'UNKNOWN',
                paymentRequestId: (data as any)?.paymentRequestId,
                finalFail: true,
              });
            }

            this.channel.ack(msg);

            return;
          }

          const nextRetry = retryCount + 1;

          const backoff = Math.pow(2, nextRetry) * 1000;

          if (this.retryEventLogger) {
            await this.retryEventLogger({
              retryCount: nextRetry,
              error: error?.message ?? 'UNKNOWN',
              paymentRequestId: (data as any)?.paymentRequestId,
              finalFail: false,
            });
          }

          this.logger.warn({
            event: 'RETRY',
            retryCount,
          });

          setTimeout(() => {
            this.channel.sendToQueue(queue, msg.content, {
              persistent: true,

              headers: {
                retryCount: nextRetry,
              },
            });
          }, backoff);

          this.channel.ack(msg);
        }
      },
    );
  }

  async onModuleDestroy() {
    this.logger.log('Closing RabbitMQ channel');

    await this.channel.close();

    this.logger.log('Closing RabbitMQ connection');

    await this.connection.close();
  }
}
