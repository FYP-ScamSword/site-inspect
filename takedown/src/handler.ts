import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

export const health = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Service deployed successfully!',
      timestamp: new Date(),
      input: event,
    }, null, 2),
  };
}
