# reporting-tool

Reporting tool to automatically output a spreadsheet with financials using:

* Bash
* NodeJS 8.x


## Installation

    npm install -g git+https://git@github.com/kmturley/reporting-tool.git

Then set your account details using:

    export REPORT_URL="name.glassfactory.io"
    export REPORT_EMAIL="name@domain.com"
    export REPORT_TOKEN="X"


## Usage

Generate a report for an office:

    report office --id 300 --start 2018-12-01 --end 2018-12-08

For a specific projects:

    report project --id 13962 --start 2018-12-01 --end 2018-12-08

For a full list of commands use:

    report --help


## Contact

For more information please contact kmturley
