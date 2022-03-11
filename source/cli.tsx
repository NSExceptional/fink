#!/usr/bin/env node

//
//  cli.tsx
//  fink
//  
//  Created by Tanner Bennett on 2021-07-13
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import React from 'react';
import { render, useApp } from 'ink';
import meow from 'meow';
import App from './app';
import { FAClient } from './api/client';

const cli = meow(`usage: fink <username|email> <password>`, {
	flags: {
	}
});

// Ensure arguments were supplied
if (cli.input.length < 2) {
	console.log(cli.help);
	process.exit(1);
}

// Extract login args
FAClient.shared.email = cli.input[0];
FAClient.shared.password = cli.input[1];

render(<App />);
