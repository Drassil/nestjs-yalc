import { Injectable } from '@nestjs/common';
import { GraphQLSchema } from 'graphql';

@Injectable()
export class AppContextService {
  public initializedApps = new Set<string>();
  private graphQLSchema!: GraphQLSchema;

  public setSchema(schema: GraphQLSchema) {
    this.graphQLSchema = schema;
  }

  public get schema() {
    return this.graphQLSchema;
  }
}
