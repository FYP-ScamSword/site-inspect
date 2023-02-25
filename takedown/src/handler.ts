import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';

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

export const sendEmail = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  var data = JSON.parse(event.body);

  console.log(`Data received ${JSON.stringify(data)}`);
  const ses = new AWS.SES();
  const params = {
    Source: data.sender,
    Destination: {
      ToAddresses: [data.receiver],
    },
    Message: {
      Body: {
        Text: {
          Data: data.message,
        }
      },
      Subject: {
        Data: data.subject,
      }
    },
  }

  try {
    const result = await ses.sendEmail(params).promise();
    console.log(result);
    return {
      statusCode: 200,
      body: 'Email sent successfully',
    }
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: `Error sending email: ${error}`,
    }
  }

}
