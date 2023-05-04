## Hashlist and Metadata Tool

### Description
This tool is being built to do a number of things that I will soon need to do on a regular basis.
It is a work in progress and will be updated as I have time to work on it.

#### The tool is going to be capable of the following:

* Pull a hash-list from first creator
* Decode the account data for each token address in the hash-list
* Pull the off-chain metadata for each token address in the hash-list and save it locally as a JSON (filename = "tokenName.json")
* Pull the images from the off-chain metadata and save them locally (filename = "tokenName.png")
* Edit the off-chain metadata and automatically re-upload it to your shdw-drive or a location of your choice
* Once the above is complete I will create a FE site which will allow a project owner to input the first creator, it will then get them to sign a transaction to cover costs of the migration, then send a final transaction to a FE for the owner of the UA to sign allowing a program to then update the onchain metadata URI (or something along these lines)

Most features in here are left un-sanitized and unsecure, if you want to host this and use it for your own purposes or repurpose it for your own needs you will need to update them yourself if you do not want everything exposed publicly, my deployment has it's own requirements that I have not included in this repo.