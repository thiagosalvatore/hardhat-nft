import path from "path";
import * as fs from "fs";
import pinataClient from "@pinata/sdk";
import "dotenv/config";
import { MetadataTemplate } from "./metadataInterface";

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = pinataClient(pinataApiKey!, pinataApiSecret!);

export const storeImages = async (imagesFilePath: string) => {
  const fullImagesPath = path.resolve(imagesFilePath);
  const files = fs.readdirSync(fullImagesPath);
  let responses = [];
  for (let fileIndex in files) {
    const readableStreamForFile = fs.createReadStream(
      `${fullImagesPath}/${files[fileIndex]}`
    );
    try {
      const response = await pinata.pinFileToIPFS(readableStreamForFile);
      responses.push(response);
    } catch (e) {
      console.log(e);
    }
  }
  return { responses, files };
};

export const storeTokenUriMetadata = async (metadata: MetadataTemplate) => {
  try {
    return await pinata.pinJSONToIPFS(metadata);
  } catch (e) {
    console.log(e);
  }
  return null;
};
