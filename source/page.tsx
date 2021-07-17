//
//  page.tsx
//  fink
//  
//  Created by Tanner Bennett on 2021-07-17
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import React, { ReactNode } from 'react';
import { Box, Text } from 'ink';
import useStdoutDimensions from 'ink-use-stdout-dimensions';

interface PageProps {
    title: string;
    children?: ReactNode;
}

export function Space(props: any) {
    return <Text> </Text>;
}

export function Page(props: PageProps) {
    const [w, h] = useStdoutDimensions();
    
    return <Box width={w} height={h} paddingLeft={1} borderStyle='single' flexDirection='column'>
        <Box marginTop={-1} paddingBottom={1}>
            <Text>Funimation Downloader</Text>
        </Box>
        <Box paddingBottom={1} flexGrow={1} flexDirection='column'>
            <Text>{props.title}</Text>
            <Box flexDirection='column'>
                {props.children}
            </Box>
        </Box>
    </Box>;
}
