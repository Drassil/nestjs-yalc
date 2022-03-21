import { Deserializer, ReadPacket } from '@nestjs/microservices';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { SchemaRegistryAPIClientArgs } from '@kafkajs/confluent-schema-registry/dist/api';
import { SchemaRegistryAPIClientOptions } from '@kafkajs/confluent-schema-registry/dist/@types';
import { KafkaMessage } from '@nestjs/microservices/external/kafka.interface';
import { DeserializedData } from '../interface/debezium.interface';

/**
 * Deserializer for Kafka data by using Avro Schema
 */
export class KafkaAvroDeserializer
  implements Deserializer<KafkaMessage, ReadPacket<DeserializedData<any, any>>>
{
  protected registry: SchemaRegistry;

  constructor(
    config: SchemaRegistryAPIClientArgs,
    options?: SchemaRegistryAPIClientOptions,
  ) {
    this.registry = new SchemaRegistry(config, options);
  }

  /**
   * Deserializer function: The return type must be a ReadPacket type for the purpose of using MessagePattern Nestjs
   * @param message
   * @param _options
   * @returns
   */
  async deserialize(message: any, _options?: Record<string, any>) {
    try {
      message.key =
        message.key?.length > 0
          ? await this.registry.decode(message.key)
          : null;
      message.value = message.value
        ? await this.registry.decode(message.value)
        : message.value;
    } catch (e) {
      console.error('Deserialization error', e);
    }

    return {
      pattern: message.topic,
      data: {
        value: message.value,
        key: message.key,
      },
    };
  }
}
