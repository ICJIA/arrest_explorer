# Arrests Explorer

## Graphical User Interface

Runs locally with `npm run serve`, or is compiled with `npm run build`.

Currently live at [hungry-bohr-5cc8da.netlify.app](https://hungry-bohr-5cc8da.netlify.app).

## Application Programing Interface

Runs as a lambda function from [functions/api.js](./functions/api.js), and uses [dataview.js](./src/dataview.js), [data.json](./src/data.json), and [levels.json](./src/levels.json).

Currently live at [hungry-bohr-5cc8da.netlify.app/.netlify/functions/api](https://hungry-bohr-5cc8da.netlify.app/.netlify/functions/api).

The [examples](./examples) directory has example scripts of the API's use in R ([api_examples.R](./examples/api_examples.R)) and Python ([api_examples.py](./examples/api_examples.py)).
