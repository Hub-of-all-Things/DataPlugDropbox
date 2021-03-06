

# Photos Data Plug for HAT

Photos Data Plug service allows HAT users to copy their photos from any number of Dropbox folders to the HAT. Once the service is set up by the user it will monitor the specified folders for new additions and update immediately.

## Default settings

Currently the data plug supports synchronisation of the following photo formats:

- .png
- .jpg

Once new photos are added to the Dropbox, the synchronisation is initiated in a short span of time as Dropbox webhooks are used.

Support for other data types and features will be added in the near future.

## Main features

- Minimalistic user interface with step-by-step setup process
- Integration with MarketSquare's and Dropbox's authorisation processes
- Data synchronisation performed using a combination of scheduler and webhooks
- Build using Node (v4 LTS), MongoDB and Express framework

## Getting started

### Setting up environment variables

Data plug uses environment variables to configure security-sensitive parameters. Please have the following variables set up before starting the node process.

- MARKET_ID - plug's unique ID to login with MarketSquare (obtained from MS)
- MARKET\_ACCESS\_TOKEN - access token associated with the given MARKET_ID
- MARKET_DOMAIN - domain name used by the MarketSquare (currently marketsquare.hubofallthings.net)
- HAT_USER - username to login with HATs (configured *via* MarketSquare)
- HAT_PASSWORD - password associated with the current HAT username (configured *via* MarketSquare)
- DROPBOX\_APP\_KEY - Dropbox application's key (needs to be set up separately, more information can be found [here](https://www.dropbox.com/developers))
- DROPBOX\_APP\_SECRET - application secret associated with the current Dropbox app
- NODE_ENV - can be set to either 'production' or 'development'
- SECURE - if set to 'true' will switch to https protocol for all communications
- HOST - webserver's domain name, defaults to 'localhost' if not set
- PORT - webserver's port, defaults to 3000 if not set
- MONGODB_HOST - Mongo database's domain name, defaults to 'localhost' if not set
- MONGODB_PORT - Monog database's port, defaults to 27017 if not set

### Configuration files

Amendments to the default synchronisation scheduler, data types and data fields being synchronised can be made in the app/config.js file and app/config/ folder.

### Starting the server

Clone the repository, install required npm modules and start the node server from project root directory. Make sure that MongoDB instance is running and environment variables are set up correctly.

  ```bash
  git clone https://github.com/Hub-of-all-Things/DataPlugFacebook
  cd DataPlugFacebook/
  npm install
  node bin/www
  ```

Now the homepage can be accessed at http://localhost:3000 (assuming the default setup).

## License

This work is licensed under the Mozilla Public License Version 2.0. Please read the LICENSE file for further details.
