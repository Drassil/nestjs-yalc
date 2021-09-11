import { inflateSync, deflateSync, InputType } from 'zlib';

export const inflate = (input: string) => {
  try {
    const inflated = inflateSync(Buffer.from(input, 'base64')).toString();
    return inflated;
  } catch (error) {
    return input;
  }
};

export const deflate = (input: InputType): Buffer | InputType => {
  try {
    const deflated = deflateSync(input);
    return deflated;
  } catch (error) {
    return input;
  }
};
