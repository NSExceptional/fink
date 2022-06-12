//
//  cd.tsx
//  fundl
//  
//  Created by Tanner Bennett on 2022-06-09
//  Copyright © 2022 Tanner Bennett. All rights reserved.
//

import React, { useContext, useState } from 'react';
import { Page } from './page';
import { AppContext } from './app';
import { Text, Spacer } from 'ink';
import { UncontrolledTextInput } from 'ink-text-input';
import { DownloadManager } from './dl-manager.js';
import * as fs from 'fs';
import { VSpace } from './vspace.js';

export function CWDChanger(props: React.PropsWithChildren<{}>) {
    const context = useContext(AppContext);
    const show = context.state.show!;
    // Whether the input path was valid or invalid
    const [invalid, setInvalid] = useState(false);
    
    /** Changes the current directory, if valid, and returns us to the previous screen */
    function cd(path: string) {
        if (fs.existsSync(path)) {// || path === '..') {
            DownloadManager.shared.changeDirectory(path);
            context.set.cd(false);
            setInvalid(false);
        } else {
            setInvalid(true);
        }
    }
    
    /** Displays an error about the input path, if any */
    function CDMessage() {
        if (invalid) {
            return <>
                <Spacer />
                <Text>Invalid path</Text>
            </>;
        }
        
        return <></>;
    }
    
    // I use UncontrolledTextInput so I don't have to map
    // `value` to some state variable until submission. 
    return <Page title='Change Download Location'>
        <UncontrolledTextInput
            placeholder='C:/Users/you/Desktop/'
            onSubmit={cd}
            initialValue={DownloadManager.shared.currentDirectory}
            />
        
        <VSpace />
        <Text>Hit Return to confirm or Escape to cancel.</Text>
        <CDMessage />
    </Page>;
}
