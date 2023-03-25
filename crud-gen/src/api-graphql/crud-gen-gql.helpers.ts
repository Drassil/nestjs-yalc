import { GraphQLResolveInfo } from 'graphql';

export const isAskingForCount = (info: GraphQLResolveInfo): boolean => {
  try {
    return (
      info.fieldNodes?.[0].selectionSet?.selections.some((item: any) => {
        return (
          item.name.value === 'pageData' &&
          item.selectionSet &&
          item.selectionSet.selections.some(
            (subItem: any) => subItem.name.value === 'count',
          )
        );
      }) ?? false
    );
  } catch (e) {
    // quick way to avoid having dozens of conditions to check the info structure
    return false;
  }
};
