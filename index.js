import fs from 'fs';
import path from 'path';
import { PublicKey, Connection } from "@solana/web3.js";
// import { Metaplex } from "@metaplex-foundation/js";
// import * as anchor from "@project-serum/anchor";
import express from "express";
import bodyParser from "body-parser";
import axios from 'axios';
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
    const getHashlist = async () => {
        const creator = req.body.creator;
        const projectName = req.body.projectName;
        const projectFolder = "./hashlists";

        const endpoint =
            "https://divine-aged-glitter.solana-mainnet.quiknode.pro/f592aec8c88056067246bcd39a76ea2074955fb3/";
        const connection = new Connection(endpoint, "confirmed");

        const data = {
            "method": "getProgramAccounts",
            "jsonrpc": "2.0",
            "id": 1,
            "params": [
                "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
                {
                    "encoding": "base64",
                    "filters": [
                        {
                            "memcmp": {
                                "offset": 326,
                                "bytes": `${creator}`
                            }
                        },
                        {
                            "memcmp": {
                                "offset": 358,
                                "bytes": "2"
                            }
                        }
                    ]
                }
            ]
        };

        async function saveHashList(projectName, response) {
            const projectPath = path.join(projectFolder, projectName);
            const decodedAccountsPath = path.join(projectPath, "decoded accounts");
            await fs.promises.mkdir(decodedAccountsPath, { recursive: true });

            const pubkeys = response.data.result.map((item) => item.pubkey);

            const hashListFileName = `${projectName}Hashlist.json`;
            const hashListFilePath = path.join(projectPath, hashListFileName);
            await fs.promises.writeFile(hashListFilePath, JSON.stringify(pubkeys), { flag: "w" });

            console.log(`Hashlist saved to ${hashListFilePath}`);

            // Decode accounts
            for (const [index, tokenAddress] of pubkeys.entries()) {
                try {
                    const decodedTokenAccount = await connection.getParsedAccountInfo(new PublicKey(tokenAddress));
                    if (!decodedTokenAccount) {
                        console.error(`Could not decode token account at address ${tokenAddress}. Skipping...`);
                        continue;
                    }
                    const fileName = `${index + 1}.json`;
                    const fileContents = JSON.stringify(decodedTokenAccount, null, 2);
                    const filePath = path.join(decodedAccountsPath, fileName);
                    await fs.promises.writeFile(filePath, fileContents);
                    console.log(`Decoded token account saved to ${filePath}`);
                } catch (err) {
                    console.error(`Error processing token account at address ${tokenAddress}:`, err);
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }

        if (req !== null) {
            console.log("Getting hashlist...");
            axios
                .post(endpoint, data)
                .then(async function (response) {
                    await saveHashList(projectName, response);
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).send({ error: "Error getting the hashlist for the provided creator." });
                });
        }
    };
    await getHashlist();
});


//Python to turn into nodejs

// const maxRetries = 3;

// // Create directories if they don't exist
// mkdirp.sync('fetchedJson');
// mkdirp.sync('fetchedimages');

// const allData = {};

// // Read JSON files from `mints_data` directory
// fs.readdirSync('mints_data').forEach((filename) => {
//     if (path.extname(filename) === '.json') {
//         const jsonData = JSON.parse(fs.readFileSync(path.join('mints_data', filename)));
//         const mintId = path.basename(filename, '.json');
//         const name = jsonData['name'].replace(/\u0000/g, '');
//         const uri = jsonData['uri'].replace(/\u0000/g, '');
//         allData[mintId] = { name, uri };
//     }
// });

// // Write allData to `output.json`
// fs.writeFileSync('output.json', JSON.stringify(allData));

// // Fetch JSON and image for each mint
// for (const [mintId, data] of Object.entries(allData)) {
//     const { name, uri } = data;
//     let jsonData = null;

//     // Fetch JSON data
//     let retryCount = 0;
//     while (true) {
//         try {
//             const response = await axios.get(uri);
//             jsonData = response.data;
//             fs.writeFileSync(
//                 path.join('fetchedJson', `${name}.json`),
//                 JSON.stringify(jsonData)
//             );
//             break;
//         } catch (error) {
//             if (retryCount < maxRetries) {
//                 console.error(`An error occurred while fetching ${name} (${uri}): ${error}. Retrying...`);
//                 await new Promise((resolve) => setTimeout(resolve, 1000));
//                 retryCount++;
//             } else {
//                 console.error(`Failed to fetch ${name} (${uri}) after ${retryCount} retries. Skipping...`);
//                 break;
//             }
//         }
//     }

//     if (!jsonData) {
//         continue;
//     }

//     // Fetch image data
//     const imageUrl = jsonData['image'];
//     let imageName = `${mintId}.png`;

//     if (/#/.test(name)) {
//         const match = name.match(/#(\d+)/);
//         if (match) {
//             imageName = `${match[1].padStart(4, '0')}.png`;
//         } else if (/#/.test(jsonData['name'])) {
//             const match = jsonData['name'].match(/#(\d+)/);
//             if (match) {
//                 imageName = `${match[1].padStart(4, '0')}.png`;
//             }
//         }
//     } else if (/#/.test(jsonData['name'])) {
//         const match = jsonData['name'].match(/#(\d+)/);
//         if (match) {
//             imageName = `${match[1].padStart(4, '0')}.png`;
//         }
//     }

//     retryCount = 0;
//     while (true) {
//         try {
//             const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
//             fs.writeFileSync(
//                 path.join('fetchedimages', imageName),
//                 Buffer.from(response.data, 'binary')
//             );
//             break;
//         } catch (error) {
//             if (retryCount < maxRetries) {
//                 console.error(`An error occurred while downloading the image for ${name} (${imageUrl}): ${error}. Retrying...`);
//                 await new Promise((resolve) => setTimeout(resolve, 1000));
//                 retryCount++;
//             } else {
//                 console.error(`Failed to download the image for ${name} (${imageUrl}) after ${retryCount} retries. Skipping...`);
//                 break;
//             }
//         }
//     }
// }

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});