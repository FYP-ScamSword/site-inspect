# ScamSword-Takedown API

A set of serverless functions that enable simplified takedown requests to DNS registrars and web hosting providers. This project is built with [Serverless](https://www.serverless.com/)

## Usage

- Set up [serverless](https://www.serverless.com/framework/docs/getting-started) and [AWS CLI credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) for deployment
- Add [verified identities](https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html) for sending and receiving emails through AWS SES
- Install project dependencies with `npm i`

#### Local deployment

- You can test the API locally using `serverless offline`

```
sls offline
```

You should see something similar to the following output:

```
Starting Offline at stage dev (us-east-1)

Offline [http for lambda] listening on http://localhost:3002
Function names exposed for local invocation by aws-sdk:
           * health: takedown-dev-health
           * sendEmail: takedown-dev-sendEmail
           * sendEmailTemplate: takedown-dev-sendEmailTemplate

   ┌─────────────────────────────────────────────────────────────────────────────────────┐
   │                                                                                     │
   │   GET  | http://localhost:3000/health                                               │
   │   POST | http://localhost:3000/2015-03-31/functions/health/invocations              │
   │   POST | http://localhost:3000/sendEmail                                            │
   │   POST | http://localhost:3000/2015-03-31/functions/sendEmail/invocations           │
   │   POST | http://localhost:3000/sendEmailTemplate                                    │
   │   POST | http://localhost:3000/2015-03-31/functions/sendEmailTemplate/invocations   │
   │                                                                                     │
   └─────────────────────────────────────────────────────────────────────────────────────┘

Server ready: http://localhost:3000 🚀
```

#### Cloud deployment

- Deploy the API to AWS lambda with the following command:

```
$ sls deploy
```

After deploying, you should something similar to the following output:

```bash
✔ Service deployed to stack takedown-dev (173s)

endpoints:
  GET - https://sqbbvuce96.execute-api.us-east-1.amazonaws.com/health
  POST - https://sqbbvuce96.execute-api.us-east-1.amazonaws.com/sendEmail
  POST - https://sqbbvuce96.execute-api.us-east-1.amazonaws.com/sendEmailTemplate
functions:
  health: takedown-dev-health (31 MB)
  sendEmail: takedown-dev-sendEmail (31 MB)
  sendEmailTemplate: takedown-dev-sendEmailTemplate (31 MB)
```

_Note_: In current form, after deployment, your API is public and can be invoked by anyone. For production deployments, you might want to configure an authorizer. For details on how to do that, refer to [http event docs](https://www.serverless.com/framework/docs/providers/aws/events/apigateway/).

### Invocation

After successful deployment, you can call the created application via HTTP:

```bash
curl https://xxxxxxx.execute-api.us-east-1.amazonaws.com/
```

### Local development

You can invoke your function locally by using the following command:

```bash
serverless invoke local --function hello
```

Which should result in response similar to the following:

```
{
  "statusCode": 200,
  "body": "{\n  \"message\": \"Go Serverless v3.0! Your function executed successfully!\",\n  \"input\": \"\"\n}"
}
```


Alternatively, it is also possible to emulate API Gateway and Lambda locally by using `serverless-offline` plugin. In order to do that, execute the following command:

```bash
serverless plugin install -n serverless-offline
```

It will add the `serverless-offline` plugin to `devDependencies` in `package.json` file as well as will add it to `plugins` in `serverless.yml`.

After installation, you can start local emulation with:

```
serverless offline
```

To learn more about the capabilities of `serverless-offline`, please refer to its [GitHub repository](https://github.com/dherault/serverless-offline).
