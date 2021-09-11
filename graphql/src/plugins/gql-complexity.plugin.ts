import { Plugin } from '@nestjs/graphql';
import {
  GraphQLRequestListener,
  ApolloServerPlugin,
} from 'apollo-server-plugin-base';
import { GqlComplexityHelper } from './gql-complexity.helper';

@Plugin()
export class GqlComplexityPlugin implements ApolloServerPlugin {
  requestDidStart(): GraphQLRequestListener {
    return {
      async didResolveOperation({ document }) {
        GqlComplexityHelper.processDocumentAST(document);
      },
    };
  }
}
