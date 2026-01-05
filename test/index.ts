import { describe, it, afterEach} from "mocha";
import { handler, Input, Output, storage, storeToS3 } from "../index";
import { stub, restore } from "sinon";
import axios from "axios";
import { strictEqual } from "node:assert";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";



const executeLambda = async (ur: string, name: string): Promise<Output | null> => {
    const output = await handler({
        queryStringParameters: {
            url: ur,
            name: name,
        }
    } as any);

    let outputBody: Output | null = null;
    if (output && output.body) {
        outputBody = JSON.parse(output.body);
    }
    return outputBody;
}


const s3UrlFile = 'https://s3-bucket-url/test.html';
const title = 'Example Domain';

afterEach(restore);

describe("handler", () => {
    it ("should get the html from a valid URL", async () => {
        const s3_url = 'https://s3-bucket-url/test.html';

        stub(axios, 'get').resolves({ data: `<html><head><title>${title}</title></head><body></body></html>` });
        stub(storage, 'storeHtmlFile').resolves(s3_url);

        const result = await executeLambda("https://example.com", "test");

        console.log("Lambda output:", result);
        strictEqual(result?.s3_url, s3_url);
    });

    it ("should extract and return the page title of an url", async () => {
        const name = '__file_name__';
        const html = `<html><head><title>${title}</title></head><body></body></html>`;

        stub(axios, 'get').resolves({ data: html});

        const storeHtmlStub = stub(storage, 'storeHtmlFile').resolves(s3UrlFile);
        const output = await executeLambda("https://example.com", "");
        strictEqual(output?.title, title);
        strictEqual(storeHtmlStub.calledOnceWith(), true);
    });
})