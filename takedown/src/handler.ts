import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';

/**
 * Health check endpoint
 * @param event
 * @returns
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
 *
 * @param event
 * @returns
 */
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

export const sendRawEmail = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
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

/**
 * Send a templated email
 * @param event
 * @returns
 */
export const sendTemplatedEmail = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  var data = JSON.parse(event.body);

  console.log(`Data received ${JSON.stringify(data)}`);
  const ses = new AWS.SES();
  const params = {
    Source: data.sender,
    Destination: {
      ToAddresses: [data.receiver],
    },
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
