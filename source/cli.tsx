#!/usr/bin/env node

//
//  cli.tsx
//  fundl
//  
//  Created by Tanner Bennett on 2021-07-13
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import React from 'react';
import { render, useApp } from 'ink';
import meow from 'meow';
import App from './app';
import { FAClient } from './api/client';
import { DownloadManager } from './dl-manager.js';

const cli = meow(`
usage: fundl <username|email> <password>
Log into Funimation in Google Chrome, too, for downloads to work.`, {
	flags: {
		createFolders: {
			type: 'boolean',
			alias: 'f',
			default: false,
		},
		startIn: {
			type: 'string',
			alias: 's'
		}
	}
});

// Ensure arguments were supplied
if (cli.input.length < 2) {
	console.log(cli.help);
	process.exit(1);
}

// Ensure yt-dlp is installed
if (!FAClient.shared.ytdlInstalled) {
	console.log(`yt-dlp is not installed. Expected at:\n${FAClient.shared.ytdlPath}`);
	process.exit(1);
}

// Extract login args
FAClient.shared.email = cli.input[0];
FAClient.shared.password = cli.input[1];

// Extract other flags
DownloadManager.shared.createFolders = cli.flags.createFolders;
if (cli.flags.startIn) {
	DownloadManager.shared.changeDirectory(cli.flags.startIn);
}

render(<App />);
