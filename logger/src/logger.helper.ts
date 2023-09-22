import fastRedact from 'fast-redact';
import lodash from 'lodash';
const { isEmpty } = lodash;

export function maskDataInObject(data?: any, paths?: string[], trace?: any) {
  if (!paths || !data || isEmpty(paths) || isEmpty(data)) {
    if (trace) data.trace = trace;

    return data;
  }

  const redact = fastRedact({
    paths,
  });

  return { ...JSON.parse(redact(data)), trace };
}
