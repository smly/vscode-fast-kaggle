import Ajv, { ValidateFunction } from 'ajv';
import { parseTree, findNodeAtLocation, JSONPath } from "jsonc-parser";
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';


function calculateLineColumn(text: string, offset: number): { line: number; column: number, end: number } {
    let line = 0;
    let column = 0;
    let end_col = 0;
    for (let i = 0; i < offset; i++) {
        if (text[i] === '\n') {
            line++;
            column = 0;
        } else {
            column++;
        }
    }
    for (let i = offset; i < text.length; i++) {
        if (text[i] === '\n') {
            break;
        } else if (text[i] === ',') {
            end_col--;
            break;
        } else {
            end_col++;
        }
    }
    return { line: line, column: column, end: column + end_col };
}


export class SchemaValidator {
    private ajv: Ajv;
    private schema: any; // JSON Schema for dataset-metadata.json
    private kernelSchema: any; // JSON Schema for kernel-metadata.json
    private schema_validate_func: ValidateFunction<unknown> | null = null;
    private kernel_schema_validate_func: ValidateFunction<unknown> | null = null;

    constructor(schema: any, kernelSchema: any) {
        this.ajv = new Ajv({allErrors: true}); // allErrors: true で全てのエラーを取得
        this.schema = schema;
        this.kernelSchema = kernelSchema;
    }

    public validate(document: TextDocument): Diagnostic[] {
        if (!(document.uri.endsWith('dataset-metadata.json') || document.uri.endsWith('kernel-metadata.json'))) {
            return [];
        }

        try {
            const jsonContent = document.getText();
            const json = JSON.parse(jsonContent);
            let valid: boolean = false;
            if (document.uri.endsWith('dataset-metadata.json')) {
                if (this.schema_validate_func === null) {
                    this.schema_validate_func = this.ajv.compile(this.schema);
                }
                valid = this.schema_validate_func(json);
                if (!valid) {
                    const jsonTree = parseTree(jsonContent);
                    return this.schema_validate_func.errors!.map(error => {
                        if (jsonTree && error.instancePath !== '') {
                            const jsonPath = error.instancePath.split('/').slice(1);
                            const node = findNodeAtLocation(jsonTree, jsonPath);

                            if (node) {
                                const { line, column, end } = calculateLineColumn(jsonContent, node.offset);
                                const range_start = {
                                    line: line, character: column
                                };
                                const range_end = {
                                    line: line, character: end
                                };
                                return {
                                    severity: DiagnosticSeverity.Warning,
                                    range: {
                                        start: range_start,
                                        end: range_end
                                    },
                                    message: `${error.instancePath} ${error.message || 'Validation error'}`,
                                    source: 'kaggle-metadta-validator'
                                };
                            }
                        }

                        const start = {
                            line: 0, character: 0
                        };
                        const end = {
                            line: 0, character: 0
                        };
                        return {
                            severity: DiagnosticSeverity.Warning,
                            range: {
                                start: start,
                                end: end
                            },
                            message: `${error.instancePath} ${error.message || 'Validation error'}`,
                            source: 'kaggle-metadta-validator'
                        };
                    });
                }
            }
            if (document.uri.endsWith('kernel-metadata.json')) {
                if (this.kernel_schema_validate_func === null) {
                    this.kernel_schema_validate_func = this.ajv.compile(this.kernelSchema);
                }
                valid = this.kernel_schema_validate_func(json);
                if (!valid) {
                    const jsonTree = parseTree(jsonContent);
                    return this.kernel_schema_validate_func.errors!.map(error => {
                        if (jsonTree && error.instancePath !== '') {
                            const jsonPath = error.instancePath.split('/').slice(1); // Convert instancePath to JSONPath array
                            const node = findNodeAtLocation(jsonTree, jsonPath); // instancePath からノードを取得

                            if (node) {
                                const { line, column, end } = calculateLineColumn(jsonContent, node.offset);
                                const range_start = {
                                    line: line, character: column
                                };
                                const range_end = {
                                    line: line, character: end
                                };
                                return {
                                    severity: DiagnosticSeverity.Warning,
                                    range: {
                                        start: range_start,
                                        end: range_end
                                    },
                                    message: `${error.instancePath} ${error.message || 'Validation error'}`,
                                    source: 'kaggle-metadta-validator'
                                };
                            }
                        }

                        const start = {
                            line: 0, character: 0
                        };
                        const end = {
                            line: 0, character: 0
                        };
                        return {
                            severity: DiagnosticSeverity.Warning,
                            range: {
                                start: start,
                                end: end
                            },
                            message: `${error.instancePath} ${error.message || 'Validation error'}`,
                            source: 'kaggle-metadta-validator'
                        };
                    });
                }
            }

            return [];
        } catch (error) {
            const range = {
                start: document.positionAt(0),
                end: document.positionAt(document.getText().length)
            };
            return [];
            // return [{
            //     severity: DiagnosticSeverity.Error,
            //     range: range,
            //     message: `Kaggle Metadata Parse error: ${(error as Error).message}`,
            //     source: 'kaggle-metadta-validator'
            // }];
        }
    }
}