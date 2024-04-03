//
//  list.tsx
//  fundl
//  
//  Created by Tanner Bennett on 2022-09-11
//  Copyright © 2022 Tanner Bennett. All rights reserved.
//

import React from 'react';
import { Box, Text } from 'ink';

export function UL(props: { items: string[] }) {
    
    return <Box flexDirection='column'>
        {props.items.map(i => <Text>{i}</Text>)}
    </Box>;
}
