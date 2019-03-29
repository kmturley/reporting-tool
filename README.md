# reporting-tool

Reporting tool to automatically output a spreadsheet with financials using:

* Bash
* NodeJS 8.x


## Installation

    npm install -g git+https://git@github.com/kmturley/reporting-tool.git

Then create a /usr/local/bin/report/credentials.json file containing your account details:

    {
      "domain": "name.glassfactory.io",
      "email": "name@domain.com",
      "token": "X",
      "root": "api/v2"
    }


## Usage

Generate a report for an office:

    report office --id 300 --formulas true

For a specific projects:

    report project --id 13962 --formulas true

For a full list of commands use:

    report --help


## Contact

For more information please contact kmturley
