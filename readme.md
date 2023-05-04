## Hashlist and Metadata Tool

### Description
This tool is being built to do a number of things that I will soon need to do on a regular basis.
It is a work in progress and will be updated as I have time to work on it.

#### The tool is going to be capable of the following:

* Pull a hashlist from first creator
* Decode the account data for each token address in the hashlist
* Pull the offchain metadata for each token address in the hashlist and save it locally as a JSON (filename = "tokenName.json")
* Pull the images from the offchain metadata and save them locally (filename = "tokenName.png")
* Edit the offchain metadata and automatically re-upload it to your shdw-drive or a location of your choice
* Once the above is complete I will create a FE site which will allow a project owner to input the first creator, it will then get them to sign a transaction to cover costs of the migration, then send a final transaction to a FE for the owner of the UA to sign allowing a program to then update the onchain metadata URI (or something along these lines)