import { handler } from "./index";

const main = async () => {
    const res = await handler({} as any);
    console.log("Lambda function response:", res);
};

main().catch(err => {
    console.error("Error running the lambda function:", err);
});