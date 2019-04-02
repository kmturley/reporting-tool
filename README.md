# reporting-tool

Reporting tool to automatically output a spreadsheet with financials using:

* Bash
* NodeJS 8.x


## Installation

To install run the command:

    npm install -g git+https://git@github.com/kmturley/reporting-tool.git

Verify it's been installed by running:

    report --version

Create a credentials.json file containing your account details in the format:

    {
      "domain": "name.glassfactory.io",
      "email": "name@domain.com",
      "token": "X",
      "root": "api/v2"
    }

Now copy the file to the reporting tool directory using:

    cp ./credentials.json /usr/local/lib/node_modules/reporting-tool


## Usage

Generate a report for an office:

    report office --id 300 --formulas true

For a specific projects:

    report project --id 13962 --formulas true

For a full list of commands use:

    report --help


## Contact

For more information please contact kmturley
