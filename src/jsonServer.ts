import {
    createConnection,
    TextDocuments,
    Diagnostic,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    TextDocumentSyncKind,
    InitializeResult,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { SchemaValidator } from './schemaValidator';

export class JSONServer {
    private connection = createConnection(ProposedFeatures.all);
    private documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
    private schemaValidator: SchemaValidator | null = null;
    private hasConfigurationCapability: boolean = false;

    constructor() {
        this.documents.onDidClose(e => {
        });
        this.documents.onDidChangeContent(e => {
            this.validateDocument(e.document);
        });

        this.connection.onInitialize(params => this.onInitialize(params));
        this.connection.onInitialized(() => this.onInitializedHandler());
        this.connection.onDidChangeConfiguration(params => this.onDidChangeConfiguration(params));
        this.connection.onDidChangeWatchedFiles(_change => {
            this.validateAllDocuments();
        });

        this.connection.onDidOpenTextDocument(params => {
            const document = this.documents.get(params.textDocument.uri);
            if (document) {
                this.validateDocument(document);
            }
        });
        this.connection.onDidChangeTextDocument(params => {
            const document = this.documents.get(params.textDocument.uri);
            if (document) {
                this.validateDocument(document);
            }
        });
        this.connection.onDidSaveTextDocument(params => {
            const document = this.documents.get(params.textDocument.uri);
            if (document) {
                this.validateDocument(document);
            }
        });
        this.connection.onDidCloseTextDocument(params => {
        });
        this.connection.onCompletion(params => {
            return [];
        });
        this.connection.onCompletionResolve(params => {
            return params;
        });
    }

    listen(): void {
        this.documents.listen(this.connection);
        this.connection.listen();
    }

    private onInitialize(params: InitializeParams): InitializeResult {
        const capabilities = params.capabilities;
        this.hasConfigurationCapability = !!capabilities.workspace?.configuration;

        const result: InitializeResult = {
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                // completionProvider: {
                //     resolveProvider: true
                // },
                // diagnosticProvider: {
                //     identifier: 'fastkaggle',
                //     interFileDependencies: true,
                //     workspaceDiagnostics: false
                // }
            }
        };

        return result;
    }

    private async onInitializedHandler(): Promise<void> {
        if (this.hasConfigurationCapability) {
            this.connection.client.register(DidChangeConfigurationNotification.type, {
                section: 'kaggleJsonSchemaLinter'
            });
        }
        await this.updateSchemaValidator();
        this.validateAllDocuments();
    }

     private onDidChangeConfiguration(params: any): void {
        this.updateSchemaValidator();
        this.validateAllDocuments();
    }

    private async updateSchemaValidator(): Promise<void> {
        try {
            // ref: https://github.com/Kaggle/kaggle-api/wiki/Dataset-Metadata
            const datasetSchema = {
                "type": "object",
                "anyOf": [
                    { "required": ["id"] },
                    { "required": ["id_no"] }
                ],
                "properties": {
                    "id": { "type": "string", "pattern": "^[a-zA-Z0-9]+\/[a-zA-Z0-9-]{3,50}$" },
                    "id_no": { "type": "integer" },
                    "title": { "type": "string", "minLength": 5, "maxLength": 50 },
                    "subtitle": { "type": "string", "minLength": 20, "maxLength": 80 },
                },
                "required": ["id", "title"]
            };
            const kernelSchema = {
                "type": "object",
                "anyOf": [
                    { "required": ["id"] },
                    { "required": ["id_no"] }
                ],
                "properties": {
                    "id": { "type": "string", "pattern": "^[a-zA-Z0-9]+\/[a-zA-Z0-9-]{6,50}$" },
                    "id_no": { "type": "integer" },
                    "title": { "type": "string", "minLength": 5 },
                    "code_file": { "type": "string" },
                    "language": { "type": "string", "enum": ["python", "r", "markdown"] },
                    "kernel_type": { "type": "string", "enum": ["notebook", "script"] },
                    "is_private": {
                        "type": ["boolean", "string"],
                        "if": { "type": "string" },
                        "then": { "enum": ["true", "false"] }
                    },
                    "enable_gpu": {
                        "type": ["boolean", "string"],
                        "if": { "type": "string" },
                        "then": { "enum": ["true", "false"] }
                    },
                    "enable_internet": {
                        "type": ["boolean", "string"],
                        "if": { "type": "string" },
                        "then": { "enum": ["true", "false"] }
                    },
                    "dataset_sources": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                    },
                    "competition_sources": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                    },
                    "kernel_sources": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                    },
                    "model_sources": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                    },
                },
                "required": ["title", "code_file", "language", "kernel_type"]
            };
            this.schemaValidator = new SchemaValidator(datasetSchema, kernelSchema);
        } catch (error) {
            this.connection.console.error(`Failed to load schema: ${(error as Error).message}`);
            this.schemaValidator = null;
        }
    }

    private validateAllDocuments(): void {
        for (const document of this.documents.all()) {
            this.validateDocument(document);
        }
    }

    private validateDocument(textDocument: TextDocument): void {
        if (!this.schemaValidator) {
            this.connection.console.warn('Schema validator not initialized.');
            return;
        }

        const diagnostics: Diagnostic[] = this.schemaValidator.validate(textDocument);
        console.log('>> sendDiagnostics', { uri: textDocument.uri, diagnostics });
        this.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    }
}