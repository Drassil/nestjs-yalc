import fastRedact from 'fast-redact';
import { isEmpty } from 'lodash';

export function maskDataInObject(data?: any, paths?: string[]) {
  if (!paths || !data || isEmpty(paths) || isEmpty(data)) {
    return data;
  }

  const redact = fastRedact({
    paths,
  });

  return JSON.parse(redact(data));
}
