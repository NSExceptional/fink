//
//  status.tsx
//  fundl
//  
//  Created by Tanner Bennett on 2024-04-06
//  Copyright © 2024 Tanner Bennett. All rights reserved.
//

export type StatusUpdater = (status: string[]) => void;
export type StatusUpdaterFuture = () => StatusUpdater;
