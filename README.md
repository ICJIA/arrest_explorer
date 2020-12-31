# Arrests Explorer

## Graphical User Interface

Runs locally with `npm run serve`, or is compiled with `npm run build`.

Currently live at [https://icjia.illinois.gov/arrestexplorer](https://icjia.illinois.gov/arrestexplorer).

## Application Programing Interface

Runs as a lambda function from [functions/api.js](./functions/api.js), and uses [dataview.js](./src/dataview.js), [data.json](./src/data.json), and [levels.json](./src/levels.json).

Currently live at [https://icjia.illinois.gov/arrestexplorer/api](https://icjia.illinois.gov/arrestexplorer/api).

The [examples](./examples) directory has example scripts of the API's use in R ([api_example.R](./examples/api_example.R)) and Python ([api_example.py](./examples/api_example.py)).
