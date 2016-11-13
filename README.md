# awesome-report-generator

## Configuration:

In order to be able to run awesome-report-generator, include the following imports to your gulpfile:

```
const gulp = require('gulp');
...
require('awesome-report-generator')(gulp);
```

## Running awesome-report-generator:

```
$> gulp report:generate --reportConfig=path-to-report-config.json
```

## Example of report config .json file:

```
{
  "input": "./e2e/output/cucumber.json",
  "output": "./e2e/output",
  "format":[
    "html",
    "xlsx"
  ]
}
```

| Field | Description | Possible value |
|-------|-------------|----------------|
| `input` | Path to standard cucumber .json tests output | |
| `output` | Folder where generate report | |
| `format` | format of report you want to be generated | `html` and `xlsx` |
