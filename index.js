import fs from "fs";
import path from "path";
import { PublicKey, Connection } from "@solana/web3.js";
// import { Metaplex } from "@metaplex-foundation/js";
// import * as anchor from "@project-serum/anchor";
import decodeMetadata from "./metadataDecode.js";
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();
import cors from "cors";

const app = express();
const port = process.env.PORT || 3012;

var jsonParser = bodyParser.json();
// var urlEncoded = bodyParser.urlencoded({
//     limit: "100mb",
//     extended: true,
//     parameterLimit: 500000,
// });

const corsOpts = {
    origin: "*",

    methods: ["GET", "POST"],

    allowedHeaders: ["Content-Type"],
};

// const abortController = new AbortController();
// setTimeout(() => abortController.abort(), 10000);

app.use(cors(corsOpts));

app.post("/", jsonParser, async (req, res) => {
    const getHashlistAndAccounts = async () => {
        const creator = req.body.creator;
        const projectName = req.body.projectName;
        const projectFolder = "./hashlists";

        const endpoint =
            process.env.RPC ||
            "https://divine-aged-glitter.solana-mainnet.quiknode.pro/f592aec8c88056067246bcd39a76ea2074955fb3/";
        const connection = new Connection(endpoint, "confirmed");

        const data = {
            method: "getProgramAccounts",
            jsonrpc: "2.0",
            id: 1,
            params: [
                "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
                {
                    encoding: "base64",
                    filters: [
                        {
                            memcmp: {
                                offset: 326,
                                bytes: `${creator}`,
                            },
                        },
                        {
                            memcmp: {
                                offset: 358,
                                bytes: "2",
                            },
                        },
                    ],
                },
            ],
        };

        async function saveTokenData(projectName, response) {
            const projectPath = path.join(projectFolder, projectName);
            const encodedMetadataAccountsPath = path.join(
                projectPath,
                "encodedMetadata"
            );
            await fs.promises.mkdir(encodedMetadataAccountsPath, { recursive: true });

            const metadataPubkey = response.data.result.map((item) => item.pubkey);

            const metadataAccountListFileName = `${projectName}MetadataAccountList.json`;
            const metadataAccountListPath = path.join(
                projectPath,
                metadataAccountListFileName
            );
            await fs.promises.writeFile(
                metadataAccountListPath,
                JSON.stringify(metadataPubkey),
                { flag: "w" }
            );

            console.log(`Metadata token is saved to ${metadataAccountListPath}`);

            // Decode account data
            for (const [index, metadataTokenAddress] of metadataPubkey.entries()) {
                try {
                    const encodedMetadataAccount = await connection.getParsedAccountInfo(
                        new PublicKey(metadataTokenAddress)
                    );
                    if (!encodedMetadataAccount) {
                        console.error(
                            `Could not get metadata account at address ${metadataTokenAddress}. Skipping...`
                        );
                        continue;
                    }
                    const fileName = `${index + 1}.json`;
                    const fileContents = JSON.stringify(encodedMetadataAccount, null, 2);
                    const filePath = path.join(encodedMetadataAccountsPath, fileName);
                    await fs.promises.writeFile(filePath, fileContents);
                    console.log(`Encoded metadata account saved to ${filePath}`);
                } catch (err) {
                    console.error(
                        `Error processing metadata account at address ${metadataTokenAddress}:`,
                        err
                    );
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            await console.log("Fetching encoded metadata completed.")

            // Decode onchain metadata
            const decodedMetadataAccountsPath = path.join(projectPath, "decodedMetadata");
            await fs.promises.mkdir(decodedMetadataAccountsPath, { recursive: true });

            const encodedMetadataAccountFiles = await fs.promises.readdir(
                encodedMetadataAccountsPath
            );

            for (const encodedMetadataAccountFile of encodedMetadataAccountFiles) {
                console.log('Decoding metadata from buffer...')
                try {
                    const encodedMetadataAccountContents = await fs.promises.readFile(
                        path.join(encodedMetadataAccountsPath, encodedMetadataAccountFile)
                    );
                    const encodedMetadataAccount = JSON.parse(encodedMetadataAccountContents);
                    const buffer = Buffer.from(encodedMetadataAccount.value.data);
                    const decodedMetadata = await decodeMetadata(buffer);

                    const fileName = `${path.basename(decodedMetadata.mint, ".json")}.json`;
                    const filePath = path.join(decodedMetadataAccountsPath, fileName);
                    await fs.promises.writeFile(filePath, JSON.stringify(decodedMetadata), { flag: "w" });
                    console.log(`Decoded metadata saved to ${filePath}`);
                } catch (err) {
                    console.error(
                        `Error processing metadata account file ${encodedMetadataAccountFile}:`,
                        err
                    );
                }
            }
            await console.log("Decoding metadata completed.")

            const metadataJsonFiles = path.join(projectPath, "offChainMetadata");
            await fs.promises.mkdir(metadataJsonFiles, { recursive: true });

            const imageFiles = path.join(projectPath, "images");
            await fs.promises.mkdir(imageFiles, { recursive: true });

            fs.readdirSync('decodedMetadata').forEach((filename) => {
                if (path.extname(filename) === '.json') {
                    const jsonData = JSON.parse(fs.readFileSync(path.join('decodedMetadata', filename)));
                    const mintId = path.basename(filename, '.json');
                    const name = jsonData['data']['name'].replace(/\u0000/g, '');
                    const uri = jsonData['data']['uri'].replace(/\u0000/g, '');
                    fetchMintData(mintId, name, uri);
                }
            });

            async function fetchMintData(mintId, name, uri) {
                let jsonData = null;
                // Fetch JSON data
                let retryCount = 0;
                while (true) {
                    try {
                        const response = await axios.get(uri);
                        jsonData = response.data;
                        fs.writeFileSync(
                            path.join('fetchedJson', `${name}.json`),
                            JSON.stringify(jsonData)
                        );
                        break;
                    } catch (error) {
                        if (retryCount < maxRetries) {
                            console.error(`An error occurred while fetching ${name} (${uri}): ${error}. Retrying...`);
                            await new Promise((resolve) => setTimeout(resolve, 1000));
                            retryCount++;
                        } else {
                            console.error(`Failed to fetch ${name} (${uri}) after ${retryCount} retries. Skipping...`);
                            break;
                        }
                    }
                }

                if (!jsonData) {
                    return;
                }

                const imageUrl = jsonData['image'];
                let imageName = `${mintId}.png`;

                if (/#/.test(name)) {
                    const match = name.match(/#(\d+)/);
                    if (match) {
                        imageName = `${match[1].padStart(4, '0')}.png`;
                    } else if (/#/.test(jsonData['name'])) {
                        const match = jsonData['name'].match(/#(\d+)/);
                        if (match) {
                            imageName = `${match[1].padStart(4, '0')}.png`;
                        }
                    }
                } else if (/#/.test(jsonData['name'])) {
                    const match = jsonData['name'].match(/#(\d+)/);
                    if (match) {
                        imageName = `${match[1].padStart(4, '0')}.png`;
                    }
                }

                retryCount = 0;
                while (true) {
                    try {
                        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                        fs.writeFileSync(
                            path.join('fetchedimages', imageName),
                            Buffer.from(response.data, 'binary')
                        );
                        break;
                    } catch (error) {
                        if (retryCount < maxRetries) {
                            console.error(`An error occurred while downloading the image for ${name} (${imageUrl}): ${error}. Retrying...`);
                            await new Promise((resolve) => setTimeout(resolve, 1000));
                            retryCount++;
                        } else {
                            console.error(`Failed to download the image for ${name} (${imageUrl}) after ${retryCount} retries. Skipping...`);
                            break;
                        }
                    }
                }
            }

        }

        if (req !== null) {
            console.log(`Getting all metadata files and data for ${projectName}...`);
            axios
                .post(endpoint, data)
                .then(async function (response) {
                    await saveTokenData(projectName, response);
                })
                .catch((err) => {
                    console.log(err);
                    res
                        .status(500)
                        .send({
                            error:
                                "Error getting the metadata account list for the provided creator.",
                        });
                });
        }
    };
    await getHashlistAndAccounts();

    res.status(200).send({ message: "Getting Data" });
});

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});
