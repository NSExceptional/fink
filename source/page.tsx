//
//  page.tsx
//  fundl
//  
//  Created by Tanner Bennett on 2021-07-17
//  Copyright © 2021 Tanner Bennett. All rights reserved.
//

import React, { useContext } from 'react';
import { Box, Text } from 'ink';
import useStdoutDimensions from 'ink-use-stdout-dimensions';
import { AppContext } from './app';
import Divider from 'ink-divider';
import { DownloadManager } from './dl-manager.js';
import { UL } from './list.js';

interface PageProps {
    title: string;
}

export function Space(props: any) {
    return <Text> </Text>;
}

export function Page(props: React.PropsWithChildren<PageProps>) {
    const [w, h] = useStdoutDimensions();
    const context = useContext(AppContext);

    return <Box width={w} height={h} paddingLeft={1} borderStyle='single' flexDirection='column'>
        <Box marginTop={-1} paddingBottom={1}>
            <Text>Crunchyroll Downloader</Text>
        </Box>
        <Box paddingBottom={1} flexGrow={1} flexDirection='column'>
            <Text>{props.title}</Text>
            <Box flexDirection='column'>
                {props.children}
            </Box>
        </Box>
        <Divider width={w - 4} padding={0} />
        <UL items={context.state.status!.slice(0,3)} />
        <Text>{DownloadManager.shared.currentDirectory}  | ^D change directory</Text>
    </Box>;
}
