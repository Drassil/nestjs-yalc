import { Plugin } from "@nestjs/graphql";
import {
  GraphQLRequestListener,
  ApolloServerPlugin,
} from "apollo-server-plugin-base";
import { GqlComplexityHelper } from "./gql-complexity.helper";

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
