#!/usr/bin/env node

//
//  cli.tsx
//  fink
//  
//  Created by Tanner Bennett on 2021-07-13
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import App from './app';

const cli = meow(`
	Usage
	  $ fink [search query]

	Options
		None

	Examples
	  $ fink 'attack on titan'
`, {
	flags: {
	}
});

render(<App />);
