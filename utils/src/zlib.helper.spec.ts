import { inflate, deflate } from './zlib.helper';
import zlib from 'zlib';

const largeObject = {
  many: {
    nested: {
      values: {
        image: 'base64ImageData',
      },
      on: {
        data: 'veryLongString',
      },
      multiple: {
        levels: {
          array: ['many', 'items'],
        },
      },
    },
  },
};

const deflated =
  'eJwljbEKwzAQQ/9Fc8bSwXOXQreOpcOVCGM4X4p9MYSQf2+v1fSEhLSjim1IO4zdOQcN0ZU9qFTJRMJLOs+na7iLuOCYsFgU5nAJg227LZbv3orliOuqXt7KKCkH9bcnrcn37PE/nVCcteN5hD7QeS/h';

describe('Zlib helper test', () => {
  it('should be defined', () => {
    expect(inflate).toBeDefined();
  });

  it('should be defined', () => {
    expect(deflate).toBeDefined();
  });

  it('should be able to compress a stringified object', () => {
    expect(deflate(JSON.stringify(largeObject)).toString('base64')).toEqual(
      deflated,
    );
  });

  it('should be able to decompress a base 64 string', () => {
    expect(JSON.parse(inflate(deflated))).toEqual(largeObject);
  });

  it('should return the input on error', () => {
    expect(inflate('6')).toEqual('6');
  });

  it('should return the input on error', () => {
    jest.spyOn(zlib, 'deflateSync').mockImplementation(() => {
      throw new Error();
    });
    const res = deflate('stringToDeflate');
    expect(res).toEqual('stringToDeflate');
  });
});
