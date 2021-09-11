export interface AwsResponse {
  statusCode: number;
  body: string;
  headers: any;
  isBase64Encoded?: boolean;
}
