import { Plugin } from '@nestjs/apollo';
import {
  GraphQLRequestListener,
  ApolloServerPlugin,
} from 'apollo-server-plugin-base';
import { GqlComplexityHelper } from './gql-complexity.helper.js';

@Plugin()
export class GqlComplexityPlugin implements ApolloServerPlugin {
  async requestDidStart(): Promise<GraphQLRequestListener> {
    return {
      async didResolveOperation({ document, schema }) {
        GqlComplexityHelper.processDocumentAST(document, schema);
      },
    };
  }
}
