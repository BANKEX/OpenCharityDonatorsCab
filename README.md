# BANKEX Foundation OpenCharity DonatorsCab

Backend API for OpenCharity Donators Cabinet Frontend

# Getting Started

### Require
* NodeJS version >= 8.9

### Install
1. `git clone` this repo
2. `cd oc_donatorscab`
3. `npm install`
4. configure yamls in `config` dir. There is `development.example.yaml` for edit.

### Run
Environments run:
* development: `npm run development`
* staging:
    - make dir build
    - `npm run build`
    - `npm run staging`
* production:
    - make dir build
    - `npm run build`
    - `npm run production`

### Usage
Development. Server running on 127.0.0.1:8080. Test page - /api/testapi

### Tests
1. Install mocha globally: `npm i mocha -g`
2. Run server on your environment
3. Environments:
    * development: `npm run testDev`
    * staging: `npm run testStage`
    * production: `npm run testProd`

### Demo
https://donatorscab.staging.bankex.team/api/testapi

# API description

* [Users API](documentation/endpoints/users.md)
* [DApp API](documentation/endpoints/dapp.md)

# Other
### Code of Conduct
To have a more open and welcoming community, BankEx adheres to a [code of conduct](CODE_OF_CONDUCT.md).

### Communication
* If you need help, you found a bug or you have a feature request, open an issue
* If you want to contribute, see Contributing section.

### Contributing
* The best way to contribute is by submitting a pull request.
* Fork it
* Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

### Authors
* **Vlad Goltcer** - *Initial work* - [ye5no](https://github.com/ye5no)

### License
"OpenCharity DonatorsCab" is available under the MIT license. See the LICENSE file for more info.
