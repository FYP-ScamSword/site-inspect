import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';

/**
 * Health check endpoint
 * @param event
 * @returns status code 200, current timestamp, and API call details
 */
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

/**
 * Send an email with HTML content. For API documentation, refer to https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html#sendEmail-property
 * @param event
 * @returns status code and message
 */
export const sendEmail = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  var data = JSON.parse(event.body);

  console.log(`Data received ${JSON.stringify(data)}`);
  const ses = new AWS.SES();
  const params = {
    Source: data.Source,
    Destination: data.Destination,
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: data.Message,
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: data.Subject,
      }
    }
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

/**
 * Send a templated email
 * @param event
 * @returns status code and message
 */
export const sendTemplatedEmail = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  var data = JSON.parse(event.body);

  console.log(`Data received ${JSON.stringify(data)}`);
  const ses = new AWS.SES();
  const params = {
    Source: data.Source,
    Destination: data.Destination,
    Template: data.template,
    TemplateData: JSON.stringify(data.templateData),
  }

  try {
    const result = await ses.sendTemplatedEmail(params).promise();
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
