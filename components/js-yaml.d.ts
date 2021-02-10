import jsyaml from 'js-yaml'

declare const yaml: typeof jsyaml & {
    FUNCTIONS_SCHEMA: jsyaml.Schema
}

export default yaml
