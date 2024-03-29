import fastRedact from 'fast-redact';
import lodash from 'lodash';
const { isEmpty } = lodash;

export function maskDataInObject(data?: any, paths?: string[], trace?: any) {
  if (typeof data === 'string') data = { message: data };

  if (!paths || !data || isEmpty(paths) || isEmpty(data)) {
    if (trace) data ? (data.trace = trace) : (data = { trace });

    return data;
  }

  const redact = fastRedact({
    paths,
  });

  return { ...JSON.parse(redact(data)), trace };
}
