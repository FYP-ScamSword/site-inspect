export const health = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Service deployed successfully!',
            timestamp: new Date(),
            input: event,
        }, null, 2),
    };
};
//# sourceMappingURL=handler.js.map
