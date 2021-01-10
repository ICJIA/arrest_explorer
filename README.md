# Arrests Explorer

This repository contains aggregated Illinois arrest data, and a graphical and programming interface to it.

The interfaces are hosted by [Netlify](https://www.netlify.com) at [icjia.illinois.gov/arrestexplorer](https://icjia.illinois.gov/arrestexplorer)
and [icjia.illinois.gov/arrestexplorer/api](https://icjia.illinois.gov/arrestexplorer/api).

See the [documentation site](https://icjia-arrest-explorer-docs.netlify.app) for more about the project and data.

## Design

The dataset is stored as a JavaScript Object Notation (JSON) file ([src/data.json](./src/data.json)).

A separate JSON file contains a map of the dataset's variables and their levels ([src/levels.json](./src/levels.json)).

These files are loaded into a processor ([src/dataview.js](./src/dataview.js)), which is used by both the graphical and programming interfaces --
this is the internal interface to the dataset.

The processor includes a query parser which ingests the URL querystring in either context such that
_icjia.illinois.gov/arrestexplorer/?`{querystring}`_ and _icjia.illinois.gov/arrestexplorer/**api/**?`{querystring}`_ should result in the same data view.

## Graphical User Interface

Built with [Node](https://nodejs.org), [Vue](https://vuejs.org), [Vuetify](https://vuetifyjs.com), and [ECharts](https://echarts.apache.org).

Can be run locally with the [Netlify CLI](https://docs.netlify.com/cli/get-started) (`netlify dev`), which handles the `publicPath` setting and enables
the API function (in contrast to using the Vue CLI in this case).

## Application Programing Interface

Runs as a lambda function from [functions/api.js](./functions/api.js).

The [examples](./examples) directory has example scripts of the API's use in R ([api_example.R](./examples/api_example.R)) and Python
([api_example.py](./examples/api_example.py)).
