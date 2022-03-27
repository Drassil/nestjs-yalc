export interface IKafkaConfig {
  kafka: {
    host: string;
    sslEnabled: boolean;
    authEnabled: boolean;
    cliendId?: string;
    credentials?: {
      username: string;
      password: string;
    };
    constumerGroupId: string;
  };
  schemaRegistry: {
    url: string;
    authEnabled: boolean;
    credentials?: {
      username: string;
      password: string;
    };
  };
}
