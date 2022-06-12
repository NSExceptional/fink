//
//  vspace.tsx
//  fundl
//  
//  Created by Tanner Bennett on 2022-06-11
//  Copyright © 2022 Tanner Bennett. All rights reserved.
//

import React from 'react';
import { Text } from 'ink';

/** A vertical spacer component, like Ink's Newline, but not broken */
export function VSpace() {
    return <Text>{' '}</Text>
}
