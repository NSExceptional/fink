//
//  ytdl.d.ts
//  fink
//  
//  Created by Tanner Bennett on 2021-08-04
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

declare module "youtube-dl-wrap" {
    import * as https from 'https';
    import * as fs from 'fs';
    import * as http from 'http';
    import * as os from 'os';
    import { execFile, spawn, SpawnOptionsWithoutStdio, ChildProcess } from 'child_process';
    import { Readable } from 'stream';
    import { EventEmitter } from 'events';
    import { URL } from 'url';
    
    export interface Progress {
        percent: string;
        totalSize: string;
        currentSpeed: string;
        eta: string;
    }
    
    export interface YouTubeDLEvents extends EventEmitter {
        on(event: string, listener: (...args: any[]) => void): this;
        on(event: "close", listener: (code: number | null) => void): this;
        on(event: "error", listener: (err: Error) => void): this;
        on(event: "progress", listener: (progress: Progress) => void): this;
        on(event: "youtubeDlEvent", listener: (type: string, data: string) => void): this;
    }
    
    export default class YoutubeDlWrap {
        constructor(binaryPath?: string);
        getBinaryPath(): string;
        setBinaryPath(binaryPath: string);

        static downloadFile(fileURL: string | URL, filePath: fs.PathLike): Promise<http.IncomingMessage>

        static async downloadFromWebsite(
            filePath: string, platform: NodeJS.Platform = os.platform()
        ): Promise<http.IncomingMessage>;


        static getGithubReleases(page: number = 1, perPage: number = 1): Promise<{ tag_name: string }[]>;

        static async downloadFromGithub(
            filePath: string, version: string, platform = os.platform()
        ): Promise<http.IncomingMessage>;

        exec(
            ytdlArgs: string[] = [],
            options: SpawnOptionsWithoutStdio = {},
            abortSignal: AbortSignal | null = null
        ): YouTubeDLEvents;

        execPromise(
            ytdlArgs: string[] = [],
            options: SpawnOptionsWithoutStdio = {},
            abortSignal: AbortSignal | null = null
        ): Promise<string>;

        execStream(
            ytdlArgs: string[] = [],
            options: SpawnOptionsWithoutStdio = {},
            abortSignal: AbortSignal | null = null
        ): Readable;

        async getExtractors(): string[];
        async getExtractorDescriptions(): string[];
        async getHelp(): string;
        async getUserAgent(): string;
        async getVersion(): string;
        async getVideoInfo(youtubeDlArguments: string[]): any;
        
        static bindAbortSignal(signal?: AbortSignal, process: ChildProcess);
        static setDefaultOptions(options: SpawnOptionsWithoutStdio);
        static createError(code: string | number, processError: string, stderrData: string): Error;

        static emitYoutubeDlEvents(stringData: string, emitter: EventEmitter);
    }
}
