import { deserializeUnchecked, BinaryReader, BinaryWriter } from "borsh";
import base58 from "bs58";
// import fs from "fs";
// import path from "path";

const METADATA_REPLACE = new RegExp("\u0000", "g");

// const MetadataKey = {
//     Uninitialized: 0,
//     MetadataV1: 4,
//     EditionV1: 1,
//     MasterEditionV1: 2,
//     MasterEditionV2: 6,
//     EditionMarker: 7,
// };

// types for Borsch
// function Creator(args) {
//     this.address = args.address;
//     this.verified = args.verified;
//     this.share = args.share;
// }

function Data(args) {
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
    // this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
    // this.creators = args.creators;
}

function Metadata(args) {
    // this.key = MetadataKey.MetadataV1;
    this.updateAuthority = args.updateAuthority;
    this.mint = args.mint;
    this.data = args.data;
    // this.primarySaleHappened = args.primarySaleHappened;
    // this.isMutable = args.isMutable;
    // this.editionNonce = args.editionNonce;
}

const METADATA_SCHEMA = new Map([
    [
        Data,
        {
            kind: "struct",
            fields: [
                ["name", "string"],
                ["symbol", "string"],
                ["uri", "string"],
                // ["sellerFeeBasisPoints", "u16"],
                // ["creators", { kind: "option", type: [Creator] }],
            ]
        },
    ],
    // [
    //     Creator,
    //     {
    //         kind: "struct",
    //         fields: [
    //             ["address", "pubkeyAsString"],
    //             ["verified", "u8"],
    //             ["share", "u8"],
    //         ]
    //     },
    // ],
    [
        Metadata,
        {
            kind: "struct",
            fields: [
                ["key", "u8"],
                ["updateAuthority", "pubkeyAsString"],
                ["mint", "pubkeyAsString"],
                ["data", Data],
                // ["primarySaleHappened", "u8"],
                // ["isMutable", "u8"], // bool
            ]
        },
    ],
]);

BinaryReader.prototype.readPubkey = function () {
    const reader = this;
    const array = reader.readFixedArray(32);
    return new PublicKey(array);
};
BinaryWriter.prototype.writePubkey = function (value) {
    const writer = this;
    writer.writeFixedArray(value.toBuffer());
};
BinaryReader.prototype.readPubkeyAsString = function () {
    const reader = this;
    const array = reader.readFixedArray(32);
    return base58.encode(array);
};
BinaryWriter.prototype.writePubkeyAsString = function (value) {
    const writer = this;
    writer.writeFixedArray(base58.decode(value));
};

export default function decodeMetadata(buffer) {
    const metadata = deserializeUnchecked(
        METADATA_SCHEMA,
        Metadata,
        buffer
    );

    metadata.data.name = metadata.data.name.replace(METADATA_REPLACE, "");
    metadata.data.uri = metadata.data.uri.replace(METADATA_REPLACE, "");
    metadata.data.symbol = metadata.data.symbol.replace(METADATA_REPLACE, "");
    console.log(metadata)
    return metadata;

};

// To manually check and adjust this to your needs enter a buffer to be decoded here and run 'node metadataDecode.js'
// to see the result in the console. uncomment or comment out the data you want to be returned.

// decodeMetadata(Buffer.from([... insert your buffer here ...]));



// const projectFolder = "./hashlists";
// const projectPath = path.join(projectFolder, "TestDecode");
// // Decode metadata
// const decodedMetadataAccountsPath = path.join(projectPath, "decodedMetadata");
// const encodedMetadataAccountsPath = path.join(
//     projectPath,
//     "encodedMetadata"
// );
// await fs.promises.mkdir(decodedMetadataAccountsPath, { recursive: true });

// const encodedMetadataAccountFiles = await fs.promises.readdir(
//     encodedMetadataAccountsPath
// );

// for (const encodedMetadataAccountFile of encodedMetadataAccountFiles) {
//     try {
//         const encodedMetadataAccountContents = await fs.promises.readFile(
//             path.join(encodedMetadataAccountsPath, encodedMetadataAccountFile)
//         );
//         const encodedMetadataAccount = JSON.parse(encodedMetadataAccountContents);
//         console.log(encodedMetadataAccount.value.data)
//         const buffer = Buffer.from(encodedMetadataAccount.value.data);
//         console.log(buffer)
//         const decodedMetadata = await decodeMetadata(buffer);
//         const fileName = `${path.basename(decodedMetadata.mint, ".json")}.json`;
//         const filePath = path.join(decodedMetadataAccountsPath, fileName);
//         await fs.promises.writeFile(filePath, JSON.stringify(decodedMetadata), { flag: "w" });
//         console.log(`Decoded metadata saved to ${filePath}`);
//     } catch (err) {
//         console.error(
//             `Error processing metadata account file ${encodedMetadataAccountFile}:`,
//             err
//         );
//     }
// }