import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import * as cheerio from "cheerio";
import axios from "axios";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export interface Input {
    url: string;
    name: string;
}

export interface Output {
    title: string;
    s3_url: string;
}


const BUCKET = "lambda-url-to-html-yang";
const S3CLIENT = new S3Client({ region: "us-east-1" });

export const storage = {
    storeHtmlFile: async (content: string, name: string): Promise<string> => {
        const key = `${name}.html`;
        const putCommand = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: Buffer.from(content),
            ContentType: "text/html",   
        });

        const output = await S3CLIENT.send(putCommand);
        console.log(output);
        return `https://${BUCKET}.s3.amazon.com/${key}`;
    }
}

    

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2>  => {
    

    const output: Output = {
        title: '',
        s3_url: '',
    };

    try {
        const body = event.queryStringParameters as unknown as Input;
        const res = await axios.get(body.url);
        output.title = cheerio.load(res.data)('head > title').text();
        output.s3_url = await storage.storeHtmlFile(res.data, body.name);

        return {
            statusCode: 200,
            body: JSON.stringify(output),
        };

    } catch (error) {
        console.error("Error processing the request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }

}